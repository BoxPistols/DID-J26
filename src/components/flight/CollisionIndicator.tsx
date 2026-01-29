/**
 * CollisionIndicator Component
 *
 * Visual indicator for collision detection results
 * Shows warning/danger status with colored badges
 */

import React from 'react'
import type { WaypointCollisionResult, PathCollisionResult } from '../../lib/utils/collision'
import styles from './CollisionIndicator.module.css'

export interface CollisionIndicatorProps {
  /** Waypoint collision result */
  waypointResult?: WaypointCollisionResult
  /** Path collision result */
  pathResult?: PathCollisionResult
  /** Show detailed message */
  showMessage?: boolean
  /** Compact mode (icon only) */
  compact?: boolean
  /** Custom className */
  className?: string
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: 'DANGER' | 'WARNING' | 'SAFE'): string {
  switch (severity) {
    case 'DANGER':
      return '🚫'
    case 'WARNING':
      return '⚠️'
    case 'SAFE':
      return '✅'
    default:
      return '❓'
  }
}

/**
 * Get severity label in Japanese
 */
function getSeverityLabel(severity: 'DANGER' | 'WARNING' | 'SAFE'): string {
  switch (severity) {
    case 'DANGER':
      return '飛行禁止'
    case 'WARNING':
      return '要注意'
    case 'SAFE':
      return '飛行可能'
    default:
      return '不明'
  }
}

/**
 * CollisionIndicator Component
 *
 * Displays collision detection status with visual feedback
 *
 * @example
 * ```tsx
 * <CollisionIndicator
 *   waypointResult={result}
 *   showMessage={true}
 * />
 * ```
 */
export const CollisionIndicator: React.FC<CollisionIndicatorProps> = ({
  waypointResult,
  pathResult,
  showMessage = true,
  compact = false,
  className = ''
}) => {
  // Severity order for comparison (higher = more severe)
  const severityOrder: Record<string, number> = { DANGER: 2, WARNING: 1, SAFE: 0 }

  // Determine the most severe result between waypoint and path
  // We track which result to use for display
  const waypointSeverity = waypointResult ? severityOrder[waypointResult.severity] : -1
  const pathSeverity = pathResult ? severityOrder[pathResult.severity] : -1

  const usePath = pathSeverity > waypointSeverity
  const displayResult = usePath ? pathResult : waypointResult

  if (!displayResult) return null

  const severity = displayResult.severity
  const icon = getSeverityIcon(severity)
  const label = getSeverityLabel(severity)
  const message = displayResult.message

  const containerClass = [
    styles.container,
    styles[severity.toLowerCase()],
    compact ? styles.compact : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  if (compact) {
    return (
      <span
        className={containerClass}
        title={message}
        aria-label={`${label}: ${message}`}
      >
        {icon}
      </span>
    )
  }

  return (
    <div className={containerClass}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </div>
      {showMessage && <div className={styles.message}>{message}</div>}
      {waypointResult?.areaName && (
        <div className={styles.areaName}>エリア: {waypointResult.areaName}</div>
      )}
      {pathResult?.intersectionPoints && pathResult.intersectionPoints.length > 0 && (
        <div className={styles.intersections}>
          交差点: {pathResult.intersectionPoints.length}箇所
        </div>
      )}
    </div>
  )
}

/**
 * CollisionSummary Component
 *
 * Summary view of multiple collision results
 */
export interface CollisionSummaryProps {
  /** Map of waypoint IDs to collision results */
  waypointResults: Map<string, WaypointCollisionResult>
  /** Path collision result */
  pathResult?: PathCollisionResult | null
  /** Total collision count */
  collisionCount: number
  /** Has any collisions */
  hasCollisions: boolean
}

export const CollisionSummary: React.FC<CollisionSummaryProps> = ({
  waypointResults,
  pathResult,
  collisionCount,
  hasCollisions
}) => {
  if (!hasCollisions) {
    return (
      <div className={`${styles.summary} ${styles.safe}`}>
        <span className={styles.summaryIcon}>✅</span>
        <span className={styles.summaryText}>全ての地点が飛行可能エリアです</span>
      </div>
    )
  }

  // Count by severity
  let dangerCount = 0
  let warningCount = 0

  for (const result of waypointResults.values()) {
    if (result.isColliding) {
      if (result.severity === 'DANGER') dangerCount++
      else if (result.severity === 'WARNING') warningCount++
    }
  }

  if (pathResult?.isColliding) {
    if (pathResult.severity === 'DANGER') dangerCount++
    else if (pathResult.severity === 'WARNING') warningCount++
  }

  return (
    <div className={`${styles.summary} ${dangerCount > 0 ? styles.danger : styles.warning}`}>
      <span className={styles.summaryIcon}>{dangerCount > 0 ? '🚫' : '⚠️'}</span>
      <div className={styles.summaryDetails}>
        <div className={styles.summaryTitle}>
          {collisionCount}箇所で禁止エリアと抵触しています
        </div>
        <div className={styles.summaryBreakdown}>
          {dangerCount > 0 && <span className={styles.dangerBadge}>飛行禁止: {dangerCount}</span>}
          {warningCount > 0 && (
            <span className={styles.warningBadge}>要注意: {warningCount}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollisionIndicator
