'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type ProfileFormProps = {
  userId: string
  initialDisplayName: string
  initialAvatarUrl: string | null
  initialEmail?: string | null
}

export default function ProfileForm({
  userId,
  initialDisplayName,
  initialAvatarUrl,
  initialEmail,
}: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [avatarPath, setAvatarPath] = useState<string | null>(initialAvatarUrl)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadAvatar = async () => {
      if (!avatarPath) {
        setPreviewUrl(null)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(avatarPath, 60 * 60)

      if (!error) {
        setPreviewUrl(data?.signedUrl || null)
      }
    }

    loadAvatar()
  }, [avatarPath])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null
    setFile(nextFile)
    if (nextFile) {
      setPreviewUrl(URL.createObjectURL(nextFile))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      let nextAvatarPath = avatarPath

      if (file) {
        const fileExt = file.name.split('.').pop() || 'jpg'
        const filePath = `${userId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          })

        if (uploadError) {
          setMessage(uploadError.message)
          setLoading(false)
          return
        }

        nextAvatarPath = filePath
        setAvatarPath(filePath)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName || initialEmail || 'User',
          avatar_url: nextAvatarPath,
        })
        .eq('id', userId)

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setMessage('Profile updated.')
      setFile(null)
    } catch (err) {
      setMessage('Unable to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {message && (
        <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">
          {message}
        </div>
      )}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
        <h2 className="text-lg font-semibold text-stone-900">Profile</h2>
        <p className="mt-1 text-sm text-stone-500">
          Update your name and profile image.
        </p>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Profile avatar"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-stone-500">
                  {displayName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Profile photo</p>
              <p className="text-xs text-stone-400">PNG or JPG up to 2MB</p>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-soft-sm hover:bg-stone-50">
            <span>Upload image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-stone-700">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="mt-2 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}
