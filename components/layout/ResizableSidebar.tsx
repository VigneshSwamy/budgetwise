'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_WIDTH = 220
const MAX_WIDTH = 360
const STORAGE_KEY = 'bw_sidebar_width'

export default function ResizableSidebar({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  const [width, setWidth] = useState(MIN_WIDTH)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const draggingRef = useRef(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? Number(stored) : NaN
    if (!Number.isNaN(parsed)) {
      setWidth(Math.min(Math.max(parsed, MIN_WIDTH), MAX_WIDTH))
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(width))
  }, [width])

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!draggingRef.current) return
    const nextWidth = Math.min(Math.max(event.clientX, MIN_WIDTH), MAX_WIDTH)
    setWidth(nextWidth)
  }, [])

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  const handleMouseDown = () => {
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div className="min-h-[100svh] bg-[#FBF8F3] text-[#3D3D3D]">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E5E0D8] bg-white/95 px-4 py-3 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E0D8] bg-white/90 text-base font-semibold text-[#4A4A4A] shadow-sm"
        >
          ☰
        </button>
        <span className="text-sm font-semibold text-[#4A4A4A]">BudgetWise</span>
        <div className="w-10" />
      </div>

      <aside
        className="fixed left-0 top-0 hidden h-screen flex-col border-r border-[#E5E0D8] bg-white/85 px-6 py-8 backdrop-blur md:flex"
        style={{ width }}
      >
        {sidebar}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 hidden h-full w-1 cursor-col-resize bg-transparent md:block"
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/30"
            aria-label="Close navigation"
          />
          <aside className="relative z-40 h-full w-[80vw] max-w-xs bg-white/95 px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#4A4A4A]">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-[#E5E0D8] bg-white/90 px-3 py-1 text-xs font-semibold text-[#6B6B6B]"
              >
                Close
              </button>
            </div>
            <div className="flex h-full flex-col overflow-y-auto">{sidebar}</div>
          </aside>
        </div>
      ) : null}

      <div className="md:pl-0" style={{ paddingLeft: isDesktop ? width : 0 }}>
        <div className="w-full px-4 py-5 sm:px-6 sm:py-7 md:px-8">{children}</div>
      </div>
    </div>
  )
}
