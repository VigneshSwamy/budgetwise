'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SettingsState = {
  weekly_summary: boolean
  budget_alert_enabled: boolean
  budget_alert_threshold: number
  settlement_reminder_enabled: boolean
}

export default function UserSettingsForm({
  initialSettings,
  userId,
}: {
  initialSettings: SettingsState
  userId: string
}) {
  const [settings, setSettings] = useState<SettingsState>(initialSettings)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const updateSetting = (key: keyof SettingsState, value: boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('user_settings').upsert({
        user_id: userId,
        weekly_summary: settings.weekly_summary,
        budget_alert_enabled: settings.budget_alert_enabled,
        budget_alert_threshold: settings.budget_alert_threshold,
        settlement_reminder_enabled: settings.settlement_reminder_enabled,
      })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setMessage('Settings saved.')
    } catch (err) {
      setMessage('Failed to save settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {message && (
        <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
        <h2 className="text-lg font-semibold text-stone-900">Notifications</h2>

        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={settings.weekly_summary}
              onChange={(e) => updateSetting('weekly_summary', e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
            />
            Weekly summary email
          </label>

          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={settings.settlement_reminder_enabled}
              onChange={(e) =>
                updateSetting('settlement_reminder_enabled', e.target.checked)
              }
              className="h-4 w-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
            />
            Settlement reminders
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
        <h2 className="text-lg font-semibold text-stone-900">Budget Alerts</h2>

        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={settings.budget_alert_enabled}
              onChange={(e) =>
                updateSetting('budget_alert_enabled', e.target.checked)
              }
              className="h-4 w-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
            />
            Enable budget alerts
          </label>

          <div>
            <label className="block text-sm text-stone-600">
              Alert threshold (% remaining)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.budget_alert_threshold}
              onChange={(e) =>
                updateSetting(
                  'budget_alert_threshold',
                  Number(e.target.value || 0)
                )
              }
              className="mt-2 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save settings'}
      </button>
    </form>
  )
}
