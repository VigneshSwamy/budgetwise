'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

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
  const router = useRouter()
  const pathname = usePathname()
  const [width, setWidth] = useState(MIN_WIDTH)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const draggingRef = useRef(false)
  const showBack = pathname !== '/dashboard'

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
    <div className="min-h-[100svh] w-full max-w-[100vw] overflow-x-hidden bg-[#FBF8F3] text-[#3D3D3D]">
      <div className="safe-area-top sticky top-0 z-40 flex items-center justify-between border-b border-[#E5E0D8] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="relative z-50 flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl border border-[#D6CFC4] bg-white text-xl font-semibold text-[#2F2F2F] shadow-soft-sm transition active:scale-95"
            >
              ←
            </button>
          ) : null}
          <span className="text-sm font-semibold text-[#4A4A4A]">BudgetWise</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="relative z-50 flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl border-2 border-[#D6CFC4] bg-white text-xl font-semibold text-[#2F2F2F] shadow-soft-sm transition active:scale-95"
        >
          ☰
        </button>
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
          <aside className="safe-area-top relative z-40 h-full w-[80vw] max-w-xs bg-white/95 px-5 pb-6 pt-6 shadow-lg">
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

      <div
        className="min-w-0 md:pl-0"
        style={{
          paddingLeft: isDesktop ? width : 0,
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        <div className="w-full overflow-x-hidden px-4 py-5 sm:px-6 sm:py-7 md:px-8">
          {children}
        </div>
      </div>
    </div>
  )
}
