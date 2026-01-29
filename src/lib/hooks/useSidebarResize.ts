/**
 * useSidebarResize - Sidebar resize logic hook
 */
import { useState, useEffect, useCallback } from 'react'

export interface UseSidebarResizeOptions {
  minWidth?: number
  maxWidth?: number
  initialLeftWidth?: number
  initialRightWidth?: number
}

export interface UseSidebarResizeResult {
  leftSidebarWidth: number
  rightSidebarWidth: number
  isResizingLeft: boolean
  isResizingRight: boolean
  setLeftSidebarWidth: (width: number) => void
  setRightSidebarWidth: (width: number) => void
  startResizingLeft: () => void
  startResizingRight: () => void
}

const getStoredSidebarWidths = (): { left: number; right: number } => {
  try {
    const stored = localStorage.getItem('ui-settings')
    if (stored) {
      const { leftSidebarWidth, rightSidebarWidth } = JSON.parse(stored)
      return {
        left: typeof leftSidebarWidth === 'number' && Number.isFinite(leftSidebarWidth)
          ? leftSidebarWidth : 280,
        right: typeof rightSidebarWidth === 'number' && Number.isFinite(rightSidebarWidth)
          ? rightSidebarWidth : 220
      }
    }
  } catch {
    // ignore
  }
  return { left: 280, right: 220 }
}

export function useSidebarResize(options: UseSidebarResizeOptions = {}): UseSidebarResizeResult {
  const { minWidth = 200, maxWidth = 600 } = options
  // Use useState initialization function to read localStorage only once
  const [storedWidths] = useState(() => getStoredSidebarWidths())

  const [leftSidebarWidth, setLeftSidebarWidth] = useState(
    options.initialLeftWidth ?? storedWidths.left
  )
  const [rightSidebarWidth, setRightSidebarWidth] = useState(
    options.initialRightWidth ?? storedWidths.right
  )
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  // Persist sidebar widths to localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ui-settings')
      const parsed = stored ? JSON.parse(stored) : {}
      const nextSettings = {
        ...parsed,
        leftSidebarWidth,
        rightSidebarWidth
      }
      localStorage.setItem('ui-settings', JSON.stringify(nextSettings))
    } catch (e) {
      console.error('Failed to save sidebar widths:', e)
    }
  }, [leftSidebarWidth, rightSidebarWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(minWidth, Math.min(e.clientX, maxWidth))
        setLeftSidebarWidth(newWidth)
      } else if (isResizingRight) {
        const newWidth = Math.max(minWidth, Math.min(window.innerWidth - e.clientX, maxWidth))
        setRightSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (isResizingLeft || isResizingRight) {
        setIsResizingLeft(false)
        setIsResizingRight(false)
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
      }
    }

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingLeft, isResizingRight, minWidth, maxWidth])

  const startResizingLeft = useCallback(() => {
    setIsResizingLeft(true)
  }, [])

  const startResizingRight = useCallback(() => {
    setIsResizingRight(true)
  }, [])

  return {
    leftSidebarWidth,
    rightSidebarWidth,
    isResizingLeft,
    isResizingRight,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    startResizingLeft,
    startResizingRight
  }
}
