import Image from 'next/image'

type ProfileSummaryProps = {
  displayName: string
  email?: string | null
  avatarUrl?: string | null
}

export default function ProfileSummary({ displayName, email, avatarUrl }: ProfileSummaryProps) {
  return (
    <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-soft-md">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-stone-200 bg-stone-100 shadow-soft-sm">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${displayName} avatar`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-base font-semibold text-stone-500">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
          {email ? <p className="truncate text-xs text-stone-500">{email}</p> : null}
        </div>
      </div>
    </div>
  )
}
