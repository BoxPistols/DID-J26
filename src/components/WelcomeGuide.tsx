/**
 * WelcomeGuide - intro.js を直接使った初回訪問者向けステップツアー
 *
 * 実際のUI要素をハイライトしながら、主要機能を順に案内する。
 * intro.js-react は v8 非対応のため、intro.js API を直接使用。
 */

import { useEffect, useRef } from 'react'
import introJs from 'intro.js'
import type { TooltipPosition } from 'intro.js/src/packages/tooltip/tooltipPosition'
import 'intro.js/introjs.css'
import './WelcomeGuide.css'

export interface WelcomeGuideProps {
  /** ツアーの表示状態 */
  enabled: boolean
  /** ツアー終了時のコールバック */
  onExit: () => void
}

/** ツアーステップ定義 */
const TOUR_STEPS: { element: string; title: string; intro: string; position: TooltipPosition }[] = [
  {
    // 1. アプリ概要
    element: '[data-intro="map"]',
    title: 'DID in Japan へようこそ',
    intro: `
      <p>ドローン飛行の規制区域を地図上で確認できるツールです。</p>
      <ul style="margin:8px 0;padding-left:18px;line-height:1.8">
        <li><strong>DID・空港・飛行禁止区域</strong>の表示</li>
        <li><strong>飛行ルート</strong>の描画と規制チェック</li>
        <li><strong>天気・雨雲レーダー</strong>の確認</li>
      </ul>
      <p style="margin:10px 0 0;padding:8px 10px;background:rgba(255,165,0,0.1);border-radius:4px;font-size:12px;line-height:1.5;color:#999">
        本ツールはオープンソースのプロトタイプです。情報の正確性について保証はありません。
        飛行判断にはDIPS・NOTAM等の公式情報を必ず確認してください。<br>
        <a href="https://github.com/BoxPistols/DID-J26" target="_blank" rel="noopener noreferrer" style="color:#4a9eff">GitHub</a>
        でソースコードを公開しています。
      </p>
    `,
    position: 'floating'
  },
  {
    // 2. 検索
    element: '[data-intro="search"]',
    title: '場所を検索',
    intro: `
      <p>地名・住所を入力して飛行予定地に移動できます。</p>
      <p style="font-size:12px;color:#999;margin-top:6px">
        <kbd>Cmd+K</kbd> ですぐにフォーカスできます
      </p>
    `,
    position: 'right'
  },
  {
    // 3. 規制区域（メイン機能）
    element: '[data-intro="restrictions"]',
    title: '規制区域の確認',
    intro: `
      <p>ドローン飛行に関わる規制区域を表示できます。</p>
      <ul style="margin:8px 0;padding-left:18px;line-height:1.8">
        <li><strong>NFZ</strong> -- 空港周辺の飛行制限空域</li>
        <li><strong>DID</strong> -- 人口集中地区（飛行許可が必要）</li>
        <li><strong>レッド/イエローゾーン</strong> -- 重要施設周辺</li>
      </ul>
      <p style="font-size:12px;color:#999;margin-top:6px">
        チェックボックスでレイヤーの表示/非表示を切り替えられます
      </p>
    `,
    position: 'right'
  },
  {
    // 4. 描画ツール
    element: '[data-intro="drawing-tools"]',
    title: '飛行計画の描画',
    intro: `
      <p>地図上に飛行ルートやエリアを描画できます。</p>
      <ul style="margin:8px 0;padding-left:18px;line-height:1.8">
        <li>ポリゴン・円・ウェイポイント・経路の4種類</li>
        <li>規制区域との衝突を自動チェック</li>
        <li>GeoJSON / KML / CSV でエクスポート</li>
      </ul>
    `,
    position: 'right'
  },
  {
    // 5. 右サイドバー（環境情報）
    element: '[data-intro="right-sidebar"]',
    title: '環境情報',
    intro: `
      <p>右サイドバーでは飛行に関わる環境情報を確認できます。</p>
      <ul style="margin:8px 0;padding-left:18px;line-height:1.8">
        <li><strong>地理情報</strong> -- 陰影・標高図・傾斜量図</li>
        <li><strong>天候情報</strong> -- 雨雲レーダー・天気予報</li>
        <li><strong>電波種</strong> -- LTE通信エリア</li>
      </ul>
    `,
    position: 'left'
  },
  {
    // 6. 背景地図
    element: '[data-intro="basemap"]',
    title: '背景地図の切替',
    intro: `
      <p>OSM・地理院地図・航空写真などに切り替えられます。</p>
      <p style="font-size:12px;color:#999;margin-top:6px">
        キー <kbd>M</kbd> でも切替可能
      </p>
    `,
    position: 'right'
  },
  {
    // 6. ヘルプ
    element: '[data-intro="help-btn"]',
    title: 'ヘルプ',
    intro: `
      <p>操作方法やショートカットキーの一覧はここから確認できます。</p>
      <p style="font-size:12px;color:#999;margin-top:6px">
        キー <kbd>?</kbd> でも開けます
      </p>
    `,
    position: 'top-left-aligned'
  }
]

export function WelcomeGuide({ enabled, onExit }: WelcomeGuideProps) {
  const introRef = useRef<ReturnType<typeof introJs> | null>(null)

  useEffect(() => {
    if (!enabled) {
      // 無効化時にインスタンスが残っていたら終了
      if (introRef.current) {
        introRef.current.exit(true)
        introRef.current = null
      }
      return
    }

    // DOM要素が確実に存在するまで少し待つ
    const timer = setTimeout(() => {
      const intro = introJs()

      intro.setOptions({
        steps: TOUR_STEPS,
        nextLabel: '次へ \u2192',
        prevLabel: '\u2190 戻る',
        skipLabel: 'スキップ',
        doneLabel: '始める',
        showStepNumbers: false,
        showBullets: true,
        showProgress: true,
        exitOnOverlayClick: true,
        exitOnEsc: true,
        scrollToElement: true,
        scrollTo: 'tooltip',
        disableInteraction: false,
        overlayOpacity: 0.5,
        helperElementPadding: 8,
        tooltipClass: 'welcome-tour-tooltip'
      })

      intro.oncomplete(() => {
        introRef.current = null
        onExit()
      })

      intro.onexit(() => {
        introRef.current = null
        onExit()
      })

      introRef.current = intro
      intro.start()
    }, 500)

    return () => {
      clearTimeout(timer)
      if (introRef.current) {
        introRef.current.exit(true)
        introRef.current = null
      }
    }
  }, [enabled, onExit])

  // intro.js はDOMを直接操作するため、JSXの描画は不要
  return null
}
