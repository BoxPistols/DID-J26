/**
 * 低ズーム(z8未満)で空港空域が簡易表示になる告知トーストの「一度きり(once-ever)」状態管理。
 *
 * 恒久パネルヒントが常に真実を示すため、トーストは初回ナッジ1回で十分。
 * バージョン付きキーにより、閾値や文言を変えた際は末尾を上げて再告知できる。
 * localStorage が使えない環境(プライベートモード等)では読めない=未表示扱いにし、
 * 呼び出し側は当セッション内の重複抑止にフォールバックする。
 */
export const AIRSPACE_LOWZOOM_NOTICE_KEY = 'didj:airspace-lowzoom-notice/v1'

/** 告知を既に表示済みか。storage 不可時は false(未表示扱い)を返す。 */
export function hasSeenAirspaceLowZoomNotice(): boolean {
  try {
    return localStorage.getItem(AIRSPACE_LOWZOOM_NOTICE_KEY) === '1'
  } catch {
    return false
  }
}

/** 表示済みを永続化する。永続化できたら true、storage 不可なら false を返す。 */
export function markAirspaceLowZoomNoticeSeen(): boolean {
  try {
    localStorage.setItem(AIRSPACE_LOWZOOM_NOTICE_KEY, '1')
    return true
  } catch {
    return false
  }
}
