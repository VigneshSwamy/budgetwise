export default function BubbleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#1f6f5b]/20 blur-3xl float-soft" />
      <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-[#d4a574]/25 blur-3xl pulse-glow" />
      <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-[#8B9D83]/20 blur-3xl float-soft" />
      <div
        className="absolute left-0 top-1/3 h-24 w-24 rounded-full bg-[#1f6f5b]/35 glitter-bubble bubble-float-spin"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute left-10 bottom-10 h-20 w-20 rounded-full bg-[#d4a574]/35 glitter-bubble bubble-float-spin"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="absolute right-0 top-1/2 h-28 w-28 rounded-full bg-[#8B9D83]/35 glitter-bubble bubble-float-spin"
        style={{ animationDelay: '6s' }}
      />
      <div
        className="absolute right-12 bottom-24 h-20 w-20 rounded-full bg-[#C89B8C]/35 glitter-bubble bubble-float-spin"
        style={{ animationDelay: '9s' }}
      />
      <div
        className="absolute left-1/3 bottom-6 h-24 w-24 rounded-full bg-[#9ec0d4]/35 glitter-bubble bubble-float-spin"
        style={{ animationDelay: '12s' }}
      />
    </div>
  )
}
