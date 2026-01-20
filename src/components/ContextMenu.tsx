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

/**
 * Menu Item Component
 */
const MenuItem: React.FC<{
  item: MenuItem
  onAction: (action: string, data?: any) => void
  expandedSubmenuId: string | null
  setExpandedSubmenuId: (id: string | null) => void
}> = ({ item, onAction, expandedSubmenuId, setExpandedSubmenuId }) => {
  const hasSubmenu = item.submenu && item.submenu.length > 0
  const isExpanded = expandedSubmenuId === item.id
  const closeTimerRef = React.useRef<number | null>(null)

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (hasSubmenu) {
      setExpandedSubmenuId(item.id)
    }
  }

  const handleMouseLeave = () => {
    if (hasSubmenu) {
      // Delay closing to allow moving to submenu
      closeTimerRef.current = window.setTimeout(() => {
        setExpandedSubmenuId(null)
        closeTimerRef.current = null
      }, 100)
    }
  }

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

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
            setExpandedSubmenuId(isExpanded ? null : item.id)
          } else if (!item.disabled && item.action) {
            onAction(item.action, item.data)
          }
        }}
      >
        <div className={styles.itemContent}>
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span className={styles.label}>{item.label}</span>
          {hasSubmenu && <span className={styles.arrow}>▶</span>}
          {item.checked !== undefined && (
            <span className={styles.checkbox}>{item.checked ? '☑' : '☐'}</span>
          )}
          {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
        </div>
      </div>

      {/* Submenu */}
      {hasSubmenu && isExpanded && (
        <div
          className={styles.submenuContainer}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className={styles.submenu}>
            {item.submenu!.map((subitem) => (
              <MenuItem
                key={subitem.id}
                item={subitem}
                onAction={onAction}
                expandedSubmenuId={expandedSubmenuId}
                setExpandedSubmenuId={setExpandedSubmenuId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
  onAction
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [calculatedPos, setCalculatedPos] = useState<CalculatedPosition>({ left: 0, top: 0 })
  const [expandedSubmenuId, setExpandedSubmenuId] = useState<string | null>(null)

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

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Use capture phase to ensure we catch clicks before they propagate
    document.addEventListener('mousedown', handleOutsideClick, true)
    return () => document.removeEventListener('mousedown', handleOutsideClick, true)
  }, [isOpen, onClose])

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className={`${styles.container}`}
      style={{
        position: 'fixed',
        left: `${calculatedPos.left}px`,
        top: `${calculatedPos.top}px`,
        zIndex: 1500
      }}
    >
      <div className={styles.menu}>
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            onAction={(action, data) => {
              onAction(action, data)
              onClose()
            }}
            expandedSubmenuId={expandedSubmenuId}
            setExpandedSubmenuId={setExpandedSubmenuId}
          />
        ))}
      </div>
    </div>
  )
}

export default ContextMenu
