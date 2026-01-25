'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function VoiceDraftForm({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [voiceText, setVoiceText] = useState('')
  const [date, setDate] = useState(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  const [budgetImpact, setBudgetImpact] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [autoCreate, setAutoCreate] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleTranscribe = async () => {
    if (!audioFile) {
      setError('Please select an audio file to transcribe.')
      return
    }

    const text = await transcribeAudio(audioFile)
    if (text) {
      setVoiceText(text)
    }
  }

  const saveDraft = async (overrideText?: string) => {
    const textToUse = overrideText ?? voiceText
    const parsedNow = parseVoiceText(textToUse)

    if (!parsedNow.amount || parsedNow.amount <= 0) {
      setError('Please include a valid amount in the text.')
      return
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
        return
      }

      const periodKey = getPeriodKey(date)
      const participants = [
        {
          user_id: user.id,
          paid_amount: parsedNow.amount,
          owed_amount: parsedNow.amount,
        },
      ]

      const { error: draftError } = await supabase.from('expense_drafts').insert({
        group_id: groupId,
        created_by: user.id,
        amount: parsedNow.amount,
        merchant: parsedNow.merchant,
        date,
        period_key: periodKey,
        budget_impact: budgetImpact,
        category: null,
        category_source: 'user',
        participants,
        source: 'voice',
        status: 'draft',
        notes: textToUse || null,
      })

      if (draftError) {
        setError(draftError.message)
        setLoading(false)
        return
      }

      router.push(`/groups/${groupId}/expenses/drafts`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStartRecording = async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Recording not supported in this browser.')
      return
    }

    try {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
        setRecordedAudioUrl(null)
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      recordingChunksRef.current = []
      setRecorder(mediaRecorder)
      setIsRecording(true)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: 'audio/webm',
        })
        setAudioFile(file)
        setRecordedAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        if (autoCreate) {
          const transcript = await transcribeAudio(file)
          if (transcript) {
            setVoiceText(transcript)
            await saveDraft(transcript)
          }
        }
      }

      mediaRecorder.start(250)
    } catch (err) {
      setError('Microphone access denied.')
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  const handleTranscribeWithAuto = async () => {
    await handleTranscribe()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveDraft()
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-soft-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-terracotta-50 p-3 text-sm text-terracotta-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700">
            Voice text (stub)
          </label>
          <div className="mt-2 space-y-2">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-md file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
              >
                {isRecording ? 'Stop recording' : 'Record audio'}
              </button>
              <button
                type="button"
                onClick={handleTranscribeWithAuto}
                disabled={isTranscribing}
                className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
              >
                {isTranscribing ? 'Transcribing...' : 'Transcribe audio'}
              </button>
              <label className="inline-flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={autoCreate}
                  onChange={(e) => setAutoCreate(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
                />
                Auto-create draft after recording
              </label>
            </div>
            {recordedAudioUrl ? (
              <audio
                controls
                src={recordedAudioUrl}
                className="w-full"
                preload="metadata"
              />
            ) : null}
            {audioFile ? (
              <p className="text-xs text-stone-500">
                Recorded file: {audioFile.name} ({Math.round(audioFile.size / 1024)} KB)
              </p>
            ) : null}
          </div>
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            rows={4}
            placeholder="Example: 24.50 for coffee at Blue Bottle"
            className="mt-2 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
          <p className="mt-2 text-xs text-stone-500">
            We’ll parse the first number as amount and use text after “at” as
            merchant.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <input
            id="budgetImpactVoice"
            type="checkbox"
            checked={budgetImpact}
            onChange={(e) => setBudgetImpact(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
          />
          <label htmlFor="budgetImpactVoice" className="text-sm text-stone-700">
            Count this expense against the budget
          </label>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving draft...' : 'Save voice draft'}
        </button>
      </form>
    </div>
  )
}
