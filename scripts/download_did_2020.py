#!/usr/bin/env python3
"""
e-Statから2020年国勢調査DID（人口集中地区）データをダウンロードするスクリプト

使用方法:
    python scripts/download_did_2020.py

出力先: rawdata/2020/
"""

import time
import urllib.request
from pathlib import Path

# プロジェクトルートからの相対パス
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "rawdata" / "2020"

# e-Stat DIDデータダウンロードURL
# dlserveyId: D002005112020 (令和2年国勢調査)
# coordSys: 1 (世界測地系)
# format: shape (シェープファイル)
# downloadType: 5 (都道府県単位)
# datum: 2011 (JGD2011)
BASE_URL = "https://www.e-stat.go.jp/gis/statmap-search/data"

def build_url(pref_code: str) -> str:
    """都道府県コードからダウンロードURLを構築"""
    params = {
        "dlserveyId": "D002005112020",
        "code": pref_code,
        "coordSys": "1",
        "format": "shape",
        "downloadType": "5",
        "datum": "2011"
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{BASE_URL}?{query}"


def download_prefecture(pref_code: str) -> str:
    """
    指定された都道府県のDIDデータをダウンロード

    Returns:
        'DOWNLOADED': ダウンロード成功
        'SKIPPED': 既存ファイルがあるためスキップ
        'FAILED': エラー発生
    """
    url = build_url(pref_code)
    filename = OUTPUT_DIR / f"did_2020_{pref_code}.zip"

    # 既存ファイルチェック（厳密にコードをマッチ）
    # パターン: did_2020_XX.zip または *_XX-*.zip
    existing_files = [
        f for f in OUTPUT_DIR.glob("*.zip")
        if f"_{pref_code}." in f.name or f"_{pref_code}-" in f.name
    ]
    if existing_files:
        print(f"  [SKIP] {pref_code}: already exists ({existing_files[0].name})")
        return "SKIPPED"

    print(f"  Downloading {pref_code}...", end=" ", flush=True)

    try:
        # User-Agentを設定（e-Statはブラウザ以外を拒否することがある）
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) "
                         "Chrome/120.0.0.0 Safari/537.36"
        }
        req = urllib.request.Request(url, headers=headers)

        with urllib.request.urlopen(req, timeout=60) as response:
            content = response.read()

            # コンテンツサイズチェック（空または極小ファイルは失敗の可能性）
            if len(content) < 1000:
                print(f"WARN: Small file size ({len(content)} bytes)")

            with open(filename, "wb") as f:
                f.write(content)

            size_kb = len(content) / 1024
            print(f"OK ({size_kb:.1f} KB)")
            return "DOWNLOADED"

    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        return "FAILED"
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        return "FAILED"
    except Exception as e:
        print(f"Error: {e}")
        return "FAILED"


def main():
    """メイン処理"""
    print("=" * 60)
    print("e-Stat 2020年DIDデータ ダウンローダー")
    print("=" * 60)

    # 出力ディレクトリ作成
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    # 都道府県コード（01: 北海道 〜 47: 沖縄）
    pref_codes = [str(i).zfill(2) for i in range(1, 48)]

    downloaded_count = 0
    skipped_count = 0
    fail_count = 0

    print("Starting download...")
    print("-" * 40)

    for i, code in enumerate(pref_codes):
        status = download_prefecture(code)

        if status == "DOWNLOADED":
            downloaded_count += 1
        elif status == "SKIPPED":
            skipped_count += 1
        else:  # FAILED
            fail_count += 1

        # e-Statサーバーへの負荷軽減（失敗時と最後以外は待機）
        if status != "FAILED" and i < len(pref_codes) - 1:
            time.sleep(3)

    print("-" * 40)
    print(f"Complete! Downloaded: {downloaded_count}, Skipped: {skipped_count}, Failed: {fail_count}")
    print()

    if fail_count > 0:
        print("Note: Some downloads failed. You can re-run this script to retry.")

    print("Next step: npm run convert:did")


if __name__ == "__main__":
    main()
