'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { VoiceRecorder } from 'capacitor-voice-recorder'
import { createClient } from '@/lib/supabase/client'

function getPeriodKey(dateValue: string) {
  const date = new Date(dateValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function parseVoiceText(text: string) {
  const amountMatch = text.match(/(\d+(?:\.\d{1,2})?)/)
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0

  let merchant = text
  const atMatch = text.match(/\bat\s+(.+)$/i)
  if (atMatch?.[1]) {
    merchant = atMatch[1].trim()
  }

  return {
    amount,
    merchant: merchant || null,
  }
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

export default function VoiceDraftForm({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [voiceText, setVoiceText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingMimeTypeRef = useRef<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRecorderSupported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  const isNativeIOS =
    typeof window !== 'undefined' &&
    Capacitor.isNativePlatform?.() &&
    Capacitor.getPlatform() === 'ios'
  const shouldUseNativeRecorder = isNativeIOS
  const shouldUseFileCapture = !isRecorderSupported && !shouldUseNativeRecorder

  const parsed = useMemo(() => parseVoiceText(voiceText), [voiceText])

  const transcribeAudio = async (file: File) => {
    setIsTranscribing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', file)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || 'Transcription failed.')
        return ''
      }

      return data.text || ''
    } catch (err) {
      setError('Transcription failed.')
      return ''
    } finally {
      setIsTranscribing(false)
    }
  }

  const createExpenseFromText = async (overrideText?: string) => {
    const textToUse = overrideText ?? voiceText
    const parsedNow = parseVoiceText(textToUse)

    if (!parsedNow.amount || parsedNow.amount <= 0) {
      setError('Please include a valid amount in the text.')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return false
      }

      const today = new Date().toISOString().split('T')[0]
      const periodKey = getPeriodKey(today)
      const participants = [
        {
          user_id: user.id,
          paid_amount: parsedNow.amount,
          owed_amount: parsedNow.amount,
        },
      ]

      const { data: draftRow, error: draftError } = await supabase
        .from('expense_drafts')
        .insert({
          group_id: groupId,
          created_by: user.id,
          amount: parsedNow.amount,
          merchant: parsedNow.merchant,
          date: today,
          period_key: periodKey,
          budget_impact: true,
          category: null,
          category_source: 'user',
          participants,
          source: 'voice',
          status: 'draft',
          notes: textToUse || null,
        })
        .select('id')
        .single()

      if (draftError || !draftRow?.id) {
        setError(draftError?.message || 'Unable to save the expense.')
        setLoading(false)
        return false
      }

      const { error: confirmError } = await supabase.rpc('confirm_expense_draft', {
        draft_id: draftRow.id,
      })

      if (confirmError) {
        setError(confirmError.message)
        setLoading(false)
        return false
      }

      router.push(`/groups/${groupId}/expenses`)
      router.refresh()
      return true
    } catch (err) {
      setError('An unexpected error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  const pickBestMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return ''
    const candidates = [
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ]
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
  }

  const fileExtensionForMime = (type: string) => {
    if (type.includes('aac')) return 'aac'
    if (type.includes('mp4')) return 'm4a'
    if (type.includes('ogg')) return 'ogg'
    return 'webm'
  }

  const handleFileSelected = async (file?: File | null) => {
    if (!file) return
    setRecordedAudioUrl(URL.createObjectURL(file))
    const text = await transcribeAudio(file)
    if (text) {
      setVoiceText(text)
      await createExpenseFromText(text)
    }
  }

  const handleStartRecording = async () => {
    setError(null)
    if (shouldUseNativeRecorder) {
      try {
        const permission = await VoiceRecorder.hasAudioRecordingPermission()
        if (!permission.value) {
          const request = await VoiceRecorder.requestAudioRecordingPermission()
          if (!request.value) {
            setError('Microphone permission denied.')
            return
          }
        }
        await VoiceRecorder.startRecording()
        setIsRecording(true)
        return
      } catch (err) {
        setError('Unable to start recording.')
        setIsRecording(false)
        return
      }
    }

    if (shouldUseFileCapture) {
      fileInputRef.current?.click()
      return
    }

    try {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
        setRecordedAudioUrl(null)
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredMimeType = pickBestMimeType()
      const mediaRecorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream)
      recordingChunksRef.current = []
      recordingMimeTypeRef.current = mediaRecorder.mimeType || preferredMimeType
      setRecorder(mediaRecorder)
      setIsRecording(true)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const type = recordingMimeTypeRef.current || 'audio/webm'
        const blob = new Blob(recordingChunksRef.current, { type })
        const ext = fileExtensionForMime(type)
        const file = new File([blob], `voice-${Date.now()}.${ext}`, {
          type,
        })
        setRecordedAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        const transcript = await transcribeAudio(file)
        if (transcript) {
          setVoiceText(transcript)
          await createExpenseFromText(transcript)
        }
      }

      mediaRecorder.start(250)
    } catch (err) {
      setError('Microphone access denied.')
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    if (shouldUseNativeRecorder) {
      void (async () => {
        try {
          const { value } = await VoiceRecorder.stopRecording()
          setIsRecording(false)
          if (!value?.recordDataBase64) {
            setError('No audio captured.')
            return
          }
          const mimeType = value.mimeType || 'audio/aac'
          const blob = base64ToBlob(value.recordDataBase64, mimeType)
          const ext = fileExtensionForMime(mimeType)
          const file = new File([blob], `voice-${Date.now()}.${ext}`, {
            type: mimeType,
          })
          setRecordedAudioUrl(URL.createObjectURL(blob))
          const transcript = await transcribeAudio(file)
          if (transcript) {
            setVoiceText(transcript)
            await createExpenseFromText(transcript)
          }
        } catch (err) {
          setError('Unable to stop recording.')
          setIsRecording(false)
        }
      })()
      return
    }

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-soft-lg">
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-terracotta-50 p-3 text-sm text-terracotta-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700">
            Record a voice expense
          </label>
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {shouldUseFileCapture ? (
                <label
                  htmlFor="voice-audio-input"
                  className="relative inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-soft-sm hover:bg-stone-100"
                >
                  Record expense
                  <input
                    id="voice-audio-input"
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    capture="user"
                    onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                    className="absolute inset-0 h-full w-full opacity-0"
                  />
                </label>
              ) : (
                <button
                  type="button"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isTranscribing || loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-soft-sm hover:bg-stone-100 disabled:opacity-50"
                >
                  {isRecording ? 'Stop recording' : 'Record expense'}
                </button>
              )}
            </div>
            {isRecording ? (
              <div className="flex items-end gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span
                    key={index}
                    className={`w-1.5 rounded-full bg-emerald-500/80 ${
                      index % 3 === 0
                        ? 'h-3 animate-pulse'
                        : index % 3 === 1
                        ? 'h-5 animate-pulse'
                        : 'h-4 animate-pulse'
                    }`}
                  />
                ))}
              </div>
            ) : null}
            {shouldUseFileCapture ? (
              <p className="text-xs text-stone-500">
                Your browser will open the audio recorder when you tap “Record expense”.
              </p>
            ) : null}
            {!shouldUseFileCapture ? (
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                capture="user"
                onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                className="sr-only"
              />
            ) : null}
            {recordedAudioUrl ? (
              <audio
                controls
                src={recordedAudioUrl}
                className="w-full"
                preload="metadata"
              />
            ) : null}
          </div>
          {voiceText ? (
            <textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              rows={4}
              placeholder="Example: 24.50 for coffee at Blue Bottle"
              className="mt-2 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
            />
          ) : null}
          <p className="mt-2 text-xs text-stone-500">
            We’ll parse the first number as amount and use text after “at” as merchant.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          <div className="flex items-center justify-between">
            <span>Parsed amount</span>
            <span className="font-medium">
              ${parsed.amount ? parsed.amount.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span>Parsed merchant</span>
            <span className="font-medium">
              {parsed.merchant || 'Unknown'}
            </span>
          </div>
        </div>

        {voiceText ? (
          <button
            type="button"
            onClick={() => createExpenseFromText()}
            disabled={loading || isTranscribing}
            className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving expense...' : 'Save expense'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
