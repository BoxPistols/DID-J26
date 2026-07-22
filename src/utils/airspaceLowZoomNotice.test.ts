import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  AIRSPACE_LOWZOOM_NOTICE_KEY,
  hasSeenAirspaceLowZoomNotice,
  markAirspaceLowZoomNoticeSeen
} from './airspaceLowZoomNotice'

describe('airspaceLowZoomNotice (once-ever)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('キーはバージョン付きで名前空間衝突しない', () => {
    expect(AIRSPACE_LOWZOOM_NOTICE_KEY).toBe('didj:airspace-lowzoom-notice/v1')
  })

  it('初期状態は未表示', () => {
    // vitest.setup.ts が beforeEach で localStorage をクリアする
    expect(hasSeenAirspaceLowZoomNotice()).toBe(false)
  })

  it('mark 後は表示済みになり、永続化に成功する', () => {
    expect(markAirspaceLowZoomNoticeSeen()).toBe(true)
    expect(hasSeenAirspaceLowZoomNotice()).toBe(true)
    expect(localStorage.getItem(AIRSPACE_LOWZOOM_NOTICE_KEY)).toBe('1')
  })

  it('mark は冪等(2回呼んでも表示済みのまま)', () => {
    markAirspaceLowZoomNoticeSeen()
    markAirspaceLowZoomNoticeSeen()
    expect(hasSeenAirspaceLowZoomNotice()).toBe(true)
  })

  it('getItem が throw する環境では未表示扱い(false)にフォールバック', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    expect(hasSeenAirspaceLowZoomNotice()).toBe(false)
  })

  it('setItem が throw する環境では mark が false を返す(呼び出し側がセッション抑止へフォールバック)', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    expect(markAirspaceLowZoomNoticeSeen()).toBe(false)
  })
})
