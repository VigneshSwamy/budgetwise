import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBF8F3] text-[#4A4A4A]">
      <div className="noise-overlay" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] h-[45%] w-[45%] bg-[#8FA888]/10 blob-shape animate-pulse" />
        <div
          className="absolute top-[10%] right-[-10%] h-[35%] w-[35%] bg-[#F5DCC8]/20 blob-shape"
          style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
        />
        <div
          className="absolute bottom-[-5%] left-[10%] h-[40%] w-[40%] bg-[#F5DCC8]/15 blob-shape"
          style={{ borderRadius: '70% 30% 50% 50% / 30% 50% 70% 60%' }}
        />
        <div
          className="absolute bottom-[10%] right-[-5%] h-[30%] w-[30%] bg-[#8FA888]/10 blob-shape"
          style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </main>
  )
}
