/**
 * WelcomeGuide - 初回訪問者向けステップ式ガイダンス
 *
 * 初めてアプリを開いたユーザーに対して、
 * 3ステップで主要機能を簡潔に紹介するオーバーレイ。
 */

import { useState, useEffect, useCallback } from 'react'
import styles from './WelcomeGuide.module.css'

export interface WelcomeGuideProps {
  /** 表示状態 */
  isOpen: boolean
  /** 閉じるコールバック */
  onClose: () => void
}

// 各ステップのアイコン色
const ICON_COLORS = {
  map: '#2196f3',
  did: '#ef5350',
  draw: '#66bb6a',
  weather: '#ffa726'
} as const

/** ステップ定義 */
const STEPS = [
  {
    key: 'welcome',
    title: 'DID in Japan へようこそ',
    description:
      'ドローン飛行の規制区域を地図上で確認できるツールです。飛行計画の作成から天気確認まで、これひとつで完結します。',
    features: [
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        ),
        iconColor: ICON_COLORS.map,
        label: '規制区域の可視化',
        desc: 'DID（人口集中地区）、空港周辺、飛行禁止区域を地図上に表示'
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        ),
        iconColor: ICON_COLORS.draw,
        label: '飛行計画の描画',
        desc: '地図上にルートやエリアを描画し、規制チェック付きで計画を作成'
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
            <polyline points="13 11 9 17 15 17 11 23" />
          </svg>
        ),
        iconColor: ICON_COLORS.weather,
        label: '天気・気象情報',
        desc: '飛行予定地の天気予報や雨雲レーダーをリアルタイムで確認'
      }
    ]
  },
  {
    key: 'map-basics',
    title: '地図の基本操作',
    description: '地図の操作はシンプルです。まずは触ってみてください。',
    features: [
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        ),
        iconColor: ICON_COLORS.map,
        label: '移動・ズーム',
        desc: 'ドラッグで移動、スクロールで拡大縮小'
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
        iconColor: ICON_COLORS.did,
        label: '左サイドバー',
        desc: 'DID・空港・規制区域などのレイヤー表示を切り替え'
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
        iconColor: ICON_COLORS.draw,
        label: '右クリックメニュー',
        desc: '座標コピー、天気表示、規制エリア切替など'
      }
    ],
    shortcuts: [
      { key: '?', desc: 'ヘルプ' },
      { key: 'D', desc: 'DID表示' },
      { key: 'W', desc: '天気予報' },
      { key: 'L', desc: 'ダーク/ライト切替' }
    ]
  },
  {
    key: 'get-started',
    title: 'さあ、始めましょう',
    description:
      '地図は日本全体を表示しています。飛行予定地にズームして、規制状況を確認してみてください。',
    features: [
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ),
        iconColor: ICON_COLORS.map,
        label: '場所を検索',
        desc: '左上の検索ボックスで地名・住所を入力して移動'
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        ),
        iconColor: ICON_COLORS.draw,
        label: '飛行計画を作成',
        desc: '右サイドバーの描画ツールでルートやエリアを描画'
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        ),
        iconColor: ICON_COLORS.weather,
        label: '詳しい使い方',
        desc: 'いつでも ? キーでヘルプを表示できます'
      }
    ],
    notice:
      '本アプリの情報は参考用です。実際の飛行前には必ず最新の規制情報（DIPS・NOTAM等）を確認してください。'
  }
] as const

export function WelcomeGuide({ isOpen, onClose }: WelcomeGuideProps) {
  const [step, setStep] = useState(0)
  const totalSteps = STEPS.length

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1)
    } else {
      onClose()
    }
  }, [step, totalSteps, onClose])

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  // ESC / Enter キー対応
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleBack()
      }
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [isOpen, onClose, handleNext, handleBack])

  // 表示のたびにステップをリセット
  useEffect(() => {
    if (isOpen) setStep(0)
  }, [isOpen])

  if (!isOpen) return null

  const current = STEPS[step]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.container}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="ウェルカムガイド"
      >
        {/* ヘッダー */}
        <div className={styles.header}>
          <h2 className={styles.title}>{current.title}</h2>
          <p className={styles.subtitle}>
            ステップ {step + 1} / {totalSteps}
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`${styles.stepDot} ${i === step ? styles.active : ''} ${i < step ? styles.done : ''}`}
            />
          ))}
        </div>

        {/* コンテンツ */}
        <div className={styles.body}>
          <p className={styles.stepDescription}>{current.description}</p>

          <ul className={styles.featureList}>
            {current.features.map((f) => (
              <li key={f.label} className={styles.featureItem}>
                <div
                  className={styles.featureIcon}
                  style={{ background: `${f.iconColor}22` }}
                >
                  <span style={{ color: f.iconColor }}>{f.icon}</span>
                </div>
                <div className={styles.featureText}>
                  <p className={styles.featureLabel}>{f.label}</p>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* ショートカットヒント（ステップ2のみ） */}
          {'shortcuts' in current && current.shortcuts && (
            <div className={styles.kbdHint} style={{ marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
              {current.shortcuts.map((sc) => (
                <span key={sc.key} className={styles.kbdHint}>
                  <kbd className={styles.kbd}>{sc.key}</kbd>
                  <span className={styles.featureDesc}>{sc.desc}</span>
                </span>
              ))}
            </div>
          )}

          {/* 注意書き（最終ステップ） */}
          {'notice' in current && current.notice && (
            <p className={styles.notice}>{current.notice}</p>
          )}
        </div>

        {/* フッター */}
        <div className={styles.footer}>
          <button className={styles.skipButton} onClick={onClose}>
            スキップ
          </button>
          <div className={styles.navButtons}>
            {step > 0 && (
              <button className={styles.backButton} onClick={handleBack}>
                戻る
              </button>
            )}
            <button className={styles.nextButton} onClick={handleNext}>
              {step < totalSteps - 1 ? '次へ' : '始める'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
