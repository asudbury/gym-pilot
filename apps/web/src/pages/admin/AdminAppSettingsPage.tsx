import { useEffect, useMemo, useState } from 'react'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { Button } from '../../components/Button'
import { appTokens } from '../../constants/tokens'
import {
  loadAppSettings,
  saveAppSettings,
  type AppSettingKey,
  type AppSettingValue,
} from '@gym-pilot/shared'

const SETTING_FIELDS: Array<{
  key: AppSettingKey
  label: string
  type: 'boolean' | 'text'
}> = [
  { key: 'login_enabled', label: 'Login enabled', type: 'boolean' },
  { key: 'post_login_message', label: 'Post-login message', type: 'text' },
  { key: 'broadcast_messages', label: 'Broadcast messages', type: 'text' },
  {
    key: 'error_logging_enabled',
    label: 'Error logging enabled',
    type: 'boolean',
  },
  {
    key: 'audit_logging_enabled',
    label: 'Audit logging enabled',
    type: 'boolean',
  },
  { key: 'log_level', label: 'Log level', type: 'text' },
  {
    key: 'user_activity_logging_enabled',
    label: 'User activity logging',
    type: 'boolean',
  },
  {
    key: 'activities_my_logging_enabled',
    label: 'Activities my logging',
    type: 'boolean',
  },
]

export function AdminAppSettingsPage() {
  const [settings, setSettings] = useState<Record<string, AppSettingValue>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void (async () => {
      const values = await loadAppSettings()
      setSettings(values)
    })()
  }, [])

  const handleChange = (key: AppSettingKey, value: AppSettingValue) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      await saveAppSettings(settings)
      window.dispatchEvent(new Event('gym-pilot-settings-updated'))
      setMessage('Settings saved successfully.')
    } catch {
      setMessage('Could not save settings right now.')
    } finally {
      setSaving(false)
    }
  }

  const fieldRows = useMemo(
    () =>
      SETTING_FIELDS.map((field) => ({ ...field, value: settings[field.key] })),
    [settings],
  )

  return (
    <PageLayout>
      <PageCardLayout
        title="App settings"
        subtitle="Manage shared app settings"
        description="Control login, messaging, and logging behaviour for the whole application."
      >
        <div className="space-y-6">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSave()
            }}
          >
            {fieldRows.map((field) => (
              <label
                key={field.key}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    {field.label}
                  </span>
                  <span className="text-sm text-slate-600">
                    {field.type === 'boolean'
                      ? 'Toggle this setting on or off.'
                      : 'Use a short message or value for this setting.'}
                  </span>
                </div>

                {field.type === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(event) =>
                      handleChange(field.key, event.target.checked)
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                ) : (
                  <input
                    type="text"
                    value={typeof field.value === 'string' ? field.value : ''}
                    onChange={(event) =>
                      handleChange(field.key, event.target.value)
                    }
                    className={`${appTokens.input} w-full max-w-md`}
                  />
                )}
              </label>
            ))}

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                tone="emerald"
                disabled={saving}
                isLoading={saving}
                loadingLabel="Saving…"
              >
                Save settings
              </Button>
              {message ? (
                <span className="text-sm text-slate-600">{message}</span>
              ) : null}
            </div>
          </form>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
