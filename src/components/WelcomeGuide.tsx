/**
 * WelcomeGuide - intro.js を使った初回訪問者向けステップツアー
 *
 * 実際のUI要素をハイライトしながら、主要機能を順に案内する。
 */

import { useCallback } from 'react'
import { Steps } from 'intro.js-react'
import 'intro.js/introjs.css'
import './WelcomeGuide.css'

export interface WelcomeGuideProps {
  /** ツアーの表示状態 */
  enabled: boolean
  /** ツアー終了時のコールバック */
  onExit: () => void
}

/** ツアーステップ定義 */
const TOUR_STEPS = [
  {
    // 冒頭: 地図全体を対象にアプリ概要
    element: '[data-intro="map"]',
    title: 'DID in Japan へようこそ',
    intro: `
      <p>ドローン飛行の規制区域を地図上で確認できるツールです。</p>
      <ul style="margin:8px 0;padding-left:18px;line-height:1.8">
        <li><strong>DID（人口集中地区）</strong>の表示</li>
        <li><strong>空港周辺・飛行禁止区域</strong>の確認</li>
        <li><strong>飛行ルート</strong>の描画と規制チェック</li>
        <li><strong>天気・雨雲レーダー</strong>の確認</li>
      </ul>
      <p style="margin:10px 0 0;padding:8px 10px;background:rgba(255,165,0,0.1);border-radius:4px;font-size:12px;line-height:1.5;color:#999">
        本ツールはオープンソースのプロトタイプです。
        情報の正確性について保証はありません。実際の飛行判断にはDIPS・NOTAM等の公式情報を必ず確認してください。<br>
        <a href="https://github.com/BoxPistols/DID-J26" target="_blank" rel="noopener noreferrer" style="color:#4a9eff">GitHub</a>
        でソースコードを公開しています。
      </p>
    `
  },
  {
    // 左サイドバー
    element: '[data-intro="left-sidebar"]',
    title: 'レイヤー管理',
    intro: `
      <p>左サイドバーで表示するレイヤーを切り替えます。</p>
      <ul style="margin:8px 0;padding-left:18px;line-height:1.8">
        <li>DID（人口集中地区）</li>
        <li>空港・ヘリポート</li>
        <li>レッド/イエローゾーン</li>
        <li>地形・標高情報</li>
      </ul>
      <p style="font-size:12px;color:#999;margin-top:6px">
        キー <kbd style="background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:3px;font-family:monospace">S</kbd> で開閉できます
      </p>
    `,
    position: 'right'
  },
  {
    // 検索ボックス
    element: '[data-intro="search"]',
    title: '場所を検索',
    intro: `
      <p>地名・住所を入力して飛行予定地に移動できます。</p>
      <p style="font-size:12px;color:#999;margin-top:6px">
        <kbd style="background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:3px;font-family:monospace">Cmd+K</kbd> ですぐにフォーカスできます
      </p>
    `,
    position: 'right'
  },
  {
    // ベースマップ切替
    element: '[data-intro="basemap"]',
    title: '背景地図の切替',
    intro: `
      <p>OSM・地理院地図・航空写真などに切り替えられます。</p>
      <p style="font-size:12px;color:#999;margin-top:6px">
        キー <kbd style="background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:3px;font-family:monospace">M</kbd> でも切替可能です
      </p>
    `,
    position: 'right'
  },
  {
    // 右サイドバー（描画ツール）
    element: '[data-intro="right-sidebar"]',
    title: '描画ツール',
    intro: `
      <p>飛行ルートやエリアを地図上に描画できます。</p>
      <ul style="margin:8px 0;padding-left:18px;line-height:1.8">
        <li>ポリゴン・円・ウェイポイント・経路</li>
        <li>規制区域との衝突チェック</li>
        <li>GeoJSON/KML/CSVエクスポート</li>
      </ul>
      <p style="font-size:12px;color:#999;margin-top:6px">
        キー <kbd style="background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:3px;font-family:monospace">P</kbd> で開閉できます
      </p>
    `,
    position: 'left'
  },
  {
    // ヘルプボタン
    element: '[data-intro="help-btn"]',
    title: 'ヘルプ',
    intro: `
      <p>詳しい操作方法やショートカットキーの一覧はここから確認できます。</p>
      <p style="font-size:12px;color:#999;margin-top:6px">
        キー <kbd style="background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:3px;font-family:monospace">?</kbd> でも開けます
      </p>
    `,
    position: 'top-left-aligned'
  }
]

/** intro.js のオプション */
const INTRO_OPTIONS = {
  nextLabel: '次へ',
  prevLabel: '戻る',
  skipLabel: 'スキップ',
  doneLabel: '始める',
  showStepNumbers: false,
  showBullets: true,
  showProgress: true,
  exitOnOverlayClick: true,
  exitOnEsc: true,
  scrollToElement: false,
  disableInteraction: false,
  overlayOpacity: 0.5,
  helperElementPadding: 8,
  tooltipClass: 'welcome-tour-tooltip'
}

export function WelcomeGuide({ enabled, onExit }: WelcomeGuideProps) {
  const handleExit = useCallback(() => {
    onExit()
  }, [onExit])

  return (
    <Steps
      enabled={enabled}
      steps={TOUR_STEPS}
      initialStep={0}
      onExit={handleExit}
      options={INTRO_OPTIONS}
    />
  )
}
