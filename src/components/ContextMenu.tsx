/**
 * Context Menu Component
 * Google Maps-style right-click context menu
 * Provides quick access to map features and UI controls
 */

import React, { useEffect, useRef, useState } from 'react'
import styles from './ContextMenu.module.css'

export interface MenuItem {
  id: string
  label?: string
  icon?: string
  shortcut?: string
  divider?: boolean
  disabled?: boolean
  checked?: boolean // For toggleable items
  keepOpen?: boolean // Don't close menu after clicking (for multi-select items)
  submenu?: MenuItem[]
  action?: string
  data?: any
  type?: 'item' | 'header' | 'divider' // Menu item type
}

export interface ContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  lngLat: { lng: number; lat: number }
  darkMode: boolean
  menuItems: MenuItem[]
  onClose: () => void
  onAction: (action: string, data?: any) => void
  showCrosshair?: boolean // Show visual crosshair at click location
  showTooltip?: boolean // Show tooltip information
  restrictionInfo?: string // Restriction zone information
}

interface CalculatedPosition {
  left: number
  top: number
}

/**
 * Calculate menu position with viewport boundary detection
 */
const calculatePosition = (
  clickX: number,
  clickY: number,
  menuWidth: number,
  menuHeight: number
): CalculatedPosition => {
  const MARGIN = 8
  const maxX = window.innerWidth - MARGIN
  const maxY = window.innerHeight - MARGIN

  let left = clickX
  let top = clickY

  // Adjust if would overflow right edge
  if (left + menuWidth > maxX) {
    left = maxX - menuWidth
  }

  // Adjust if would overflow bottom edge
  if (top + menuHeight > maxY) {
    top = maxY - menuHeight
  }

  // Ensure minimum left/top
  return {
    left: Math.max(MARGIN, left),
    top: Math.max(MARGIN, top)
  }
}

// Delay constants for submenu behavior
const SUBMENU_CLOSE_DELAY = 2500 // 2.5 seconds delay before closing submenu
const SUBMENU_OPEN_DELAY = 150 // Delay before opening submenu (prevents accidental opens)

/**
 * Submenu timer context - shared between all menu items
 */
interface SubmenuTimerContext {
  requestOpen: (id: string) => void
  requestClose: () => void
  cancelTimers: () => void
}

/**
 * Context Menu Item Component
 * Named ContextMenuItem to avoid ambiguity with MenuItem interface
 */
const ContextMenuItem: React.FC<{
  item: MenuItem
  onAction: (action: string, data?: any, keepOpen?: boolean) => void
  expandedSubmenuId: string | null
  submenuTimers: SubmenuTimerContext
  isInsideSubmenu?: boolean
  parentRight?: number // Right edge of parent menu for overflow detection
}> = ({ item, onAction, expandedSubmenuId, submenuTimers, isInsideSubmenu = false, parentRight = 0 }) => {
  const hasSubmenu = item.submenu && item.submenu.length > 0
  const isExpanded = expandedSubmenuId === item.id
  const itemRef = React.useRef<HTMLDivElement>(null)
  const [openToLeft, setOpenToLeft] = React.useState(false)
  const [openUpward, setOpenUpward] = React.useState(false)

  // Check if submenu should open to the left or upward
  React.useEffect(() => {
    if (hasSubmenu && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect()
      const submenuWidth = 200 // Approximate submenu width
      const submenuHeight = Math.min(window.innerHeight * 0.5, 360) // Match CSS max-height

      // Check horizontal overflow
      const wouldOverflowRight = rect.right + submenuWidth > window.innerWidth - 8
      setOpenToLeft(wouldOverflowRight)

      // Check vertical overflow
      const wouldOverflowBottom = rect.top + submenuHeight > window.innerHeight - 8
      setOpenUpward(wouldOverflowBottom)
    }
  }, [hasSubmenu, isExpanded])

  const handleMouseEnter = () => {
    // Cancel any pending close timer when mouse enters any menu item
    submenuTimers.cancelTimers()

    if (hasSubmenu) {
      // Request to open this submenu (with delay)
      submenuTimers.requestOpen(item.id)
    }
  }

  const handleMouseLeave = () => {
    if (hasSubmenu && isExpanded) {
      // Request to close submenu (with long delay)
      submenuTimers.requestClose()
    }
  }

  // Divider item
  if (item.divider) {
    return <div className={styles.divider} />
  }

  // Header item (not clickable)
  if (item.type === 'header') {
    return <div className={styles.header}>{item.label}</div>
  }

  // Regular menu item
  return (
    <div
      ref={itemRef}
      className={styles.itemWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`${styles.item} ${item.disabled ? styles.disabled : ''} ${
          hasSubmenu ? styles.hasSubmenu : ''
        } ${isExpanded ? styles.expanded : ''}`}
        onClick={() => {
          if (hasSubmenu) {
            // Toggle submenu on click
            if (isExpanded) {
              submenuTimers.requestClose()
            } else {
              submenuTimers.cancelTimers()
              submenuTimers.requestOpen(item.id)
            }
          } else if (!item.disabled && item.action) {
            // For toggle items (with checked property) or items with keepOpen, don't close menu
            const shouldKeepOpen = item.keepOpen || item.checked !== undefined
            onAction(item.action, item.data, shouldKeepOpen)
          }
        }}
      >
        <div className={styles.itemContent}>
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span className={styles.label}>{item.label}</span>
          {hasSubmenu && <span className={styles.arrow}>{openToLeft ? '◀' : '▶'}</span>}
          {item.checked !== undefined && (
            <span className={styles.checkbox}>{item.checked ? '☑' : '☐'}</span>
          )}
          {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
        </div>
      </div>

      {/* Submenu */}
      {hasSubmenu && isExpanded && (
        <div
          className={`${styles.submenuContainer} ${openToLeft ? styles.submenuLeft : ''} ${openUpward ? styles.submenuUp : ''}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className={styles.submenu}>
            {item.submenu!.map((subitem) => (
              <ContextMenuItem
                key={subitem.id}
                item={subitem}
                onAction={onAction}
                expandedSubmenuId={expandedSubmenuId}
                submenuTimers={submenuTimers}
                isInsideSubmenu={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Menu close delay when mouse leaves the entire menu area
const MENU_CLOSE_DELAY = 2500 // 2.5 seconds

/**
 * Context Menu Component
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  lngLat,
  darkMode,
  menuItems,
  onClose,
  onAction,
  showCrosshair = true,
  showTooltip = true,
  restrictionInfo
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [calculatedPos, setCalculatedPos] = useState<CalculatedPosition>({ left: 0, top: 0 })
  const [expandedSubmenuId, setExpandedSubmenuId] = useState<string | null>(null)
  const menuCloseTimerRef = useRef<number | null>(null)
  const submenuOpenTimerRef = useRef<number | null>(null)
  const submenuCloseTimerRef = useRef<number | null>(null)
  const pendingSubmenuIdRef = useRef<string | null>(null)

  // Clear menu close timer
  const clearMenuCloseTimer = () => {
    if (menuCloseTimerRef.current) {
      clearTimeout(menuCloseTimerRef.current)
      menuCloseTimerRef.current = null
    }
  }

  // Clear all submenu timers
  const clearSubmenuTimers = () => {
    if (submenuOpenTimerRef.current) {
      clearTimeout(submenuOpenTimerRef.current)
      submenuOpenTimerRef.current = null
    }
    if (submenuCloseTimerRef.current) {
      clearTimeout(submenuCloseTimerRef.current)
      submenuCloseTimerRef.current = null
    }
    pendingSubmenuIdRef.current = null
  }

  // Submenu timer context - shared by all menu items
  const submenuTimers: SubmenuTimerContext = React.useMemo(() => ({
    requestOpen: (id: string) => {
      // Clear any pending close timer
      if (submenuCloseTimerRef.current) {
        clearTimeout(submenuCloseTimerRef.current)
        submenuCloseTimerRef.current = null
      }

      // If already expanded to this id, do nothing
      if (expandedSubmenuId === id) {
        return
      }

      // If already pending to open this id, do nothing
      if (pendingSubmenuIdRef.current === id && submenuOpenTimerRef.current) {
        return
      }

      // Clear any pending open timer for different id
      if (submenuOpenTimerRef.current) {
        clearTimeout(submenuOpenTimerRef.current)
        submenuOpenTimerRef.current = null
      }

      // Set pending and start open timer
      pendingSubmenuIdRef.current = id
      submenuOpenTimerRef.current = window.setTimeout(() => {
        setExpandedSubmenuId(id)
        submenuOpenTimerRef.current = null
        pendingSubmenuIdRef.current = null
      }, SUBMENU_OPEN_DELAY)
    },

    requestClose: () => {
      // Clear any pending open timer
      if (submenuOpenTimerRef.current) {
        clearTimeout(submenuOpenTimerRef.current)
        submenuOpenTimerRef.current = null
        pendingSubmenuIdRef.current = null
      }

      // If already closing, do nothing
      if (submenuCloseTimerRef.current) {
        return
      }

      // Start close timer with long delay
      submenuCloseTimerRef.current = window.setTimeout(() => {
        setExpandedSubmenuId(null)
        submenuCloseTimerRef.current = null
      }, SUBMENU_CLOSE_DELAY)
    },

    cancelTimers: () => {
      // Cancel close timer (keep submenu open when mouse re-enters)
      if (submenuCloseTimerRef.current) {
        clearTimeout(submenuCloseTimerRef.current)
        submenuCloseTimerRef.current = null
      }
      // Note: We don't cancel open timer here to allow smooth transitions
    }
  }), [expandedSubmenuId])

  // Handle mouse entering the menu area - cancel any pending close
  const handleMenuMouseEnter = () => {
    clearMenuCloseTimer()
    submenuTimers.cancelTimers()
  }

  // Handle mouse leaving the menu area - start delayed close
  const handleMenuMouseLeave = () => {
    clearMenuCloseTimer()
    menuCloseTimerRef.current = window.setTimeout(() => {
      onClose()
      menuCloseTimerRef.current = null
    }, MENU_CLOSE_DELAY)

    // Also start submenu close timer
    submenuTimers.requestClose()
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearMenuCloseTimer()
      clearSubmenuTimers()
    }
  }, [])

  // Calculate position when menu opens or position changes
  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    // Use requestAnimationFrame to ensure element is rendered before measuring
    const raf = requestAnimationFrame(() => {
      const rect = menuRef.current?.getBoundingClientRect()
      if (rect) {
        const newPos = calculatePosition(
          position.x,
          position.y,
          rect.width,
          rect.height
        )
        setCalculatedPos(newPos)
      }
    })

    return () => cancelAnimationFrame(raf)
  }, [isOpen, position])

  // Handle outside click - immediate close (no delay)
  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Clear any pending timers and close immediately
        clearMenuCloseTimer()
        onClose()
      }
    }

    // Use capture phase to ensure we catch clicks before they propagate
    document.addEventListener('mousedown', handleOutsideClick, true)
    return () => document.removeEventListener('mousedown', handleOutsideClick, true)
  }, [isOpen, onClose])

  // Handle ESC key - immediate close (no delay)
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        clearMenuCloseTimer()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Visual Crosshair at click location */}
      {showCrosshair && (
        <svg
          style={{
            position: 'fixed',
            left: `${position.x - 12}px`,
            top: `${position.y - 12}px`,
            width: '24px',
            height: '24px',
            pointerEvents: 'none',
            zIndex: 1499
          }}
        >
          {/* Horizontal line */}
          <line x1="0" y1="12" x2="24" y2="12" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
          {/* Vertical line */}
          <line x1="12" y1="0" x2="12" y2="24" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
          {/* Center circle */}
          <circle cx="12" cy="12" r="3" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1" />
        </svg>
      )}

      {/* Tooltip at click location */}
      {showTooltip && restrictionInfo && (
        <div
          style={{
            position: 'fixed',
            left: `${position.x + 8}px`,
            top: `${position.y - 28}px`,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1499,
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {restrictionInfo}
        </div>
      )}

      {/* Context Menu */}
      <div
        ref={menuRef}
        className={`${styles.container}`}
        style={{
          position: 'fixed',
          left: `${calculatedPos.left}px`,
          top: `${calculatedPos.top}px`,
          zIndex: 1500
        }}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      >
        <div className={styles.menu}>
          {menuItems.map((item) => (
            <ContextMenuItem
              key={item.id}
              item={item}
              onAction={(action, data, keepOpen) => {
                clearMenuCloseTimer() // Clear timer before action
                onAction(action, data)
                // Only close menu if keepOpen is not true
                if (!keepOpen) {
                  clearSubmenuTimers()
                  onClose()
                }
              }}
              expandedSubmenuId={expandedSubmenuId}
              submenuTimers={submenuTimers}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default ContextMenu
