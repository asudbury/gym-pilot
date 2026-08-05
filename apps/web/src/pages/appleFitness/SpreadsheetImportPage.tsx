import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'

export const SpreadsheetImportPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const SPREADSHEET_INPUT_KEY = 'gym-pilot:spreadsheetImportInput'
  const [spreadsheetInput, setSpreadsheetInput] = useState('')
  const [spreadsheetImportError, setSpreadsheetImportError] = useState<
    string | null
  >(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SPREADSHEET_INPUT_KEY)
      if (saved) {
        setSpreadsheetInput(saved)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleUseSampleData = () => {
    setSpreadsheetInput(`Exercise\tReps\tWorking sets\tWeek 1
DATE\t-\t-\t21st Jun
Shoulder press machine (seat height 6)\t1-4\t3\t30kg(x2) x4
Time + calories\t-\t-\t0:52 318kcal`)
    setSpreadsheetImportError(null)
  }

  const handlePreviewImport = () => {
    if (!user?.id) {
      setSpreadsheetImportError(
        'You must be logged in to import spreadsheet sessions.',
      )
      return
    }

    if (!spreadsheetInput.trim()) {
      setSpreadsheetImportError(
        'Please paste some spreadsheet content before importing.',
      )
      return
    }

    setSpreadsheetImportError(null)
    navigate('/apple-fitness/import-spreadsheet/preview', {
      state: { spreadsheetInput },
    })
  }

  return (
    <PageLayout className="gap-6">
      <PageCardLayout
        title="Import spreadsheet sessions"
        description="Paste tab-separated, CSV, or workbook-style content to create sessions and workout rows."
        icon="apple"
      >
        <div className="flex items-center space-x-3">
          <Button as={NavLink} to="/apple-fitness" tone="default">
            Back to Apple Fitness
          </Button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Paste one of these formats:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Tab-separated table data</li>
                <li>Comma-separated CSV data</li>
                <li>Workbook-style JSON with sheets</li>
              </ul>
            </div>
            <textarea
              rows={10}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Exercise\tReps\tWorking sets\tWeek 1
DATE\t-\t-\t21st Jun
Shoulder press machine\t1-4\t3\t30kg(x2) x4"
              value={spreadsheetInput}
              onChange={(event) => {
                const next = event.target.value
                setSpreadsheetInput(next)
                try {
                  localStorage.setItem(SPREADSHEET_INPUT_KEY, next)
                } catch {
                  // ignore
                }
              }}
            />
            <div className="flex items-center space-x-3">
              <Button onClick={handleUseSampleData} tone="default">
                Use sample data
              </Button>
              <Button onClick={handlePreviewImport} tone="default">
                Preview import
              </Button>
            </div>
            {spreadsheetImportError && (
              <StatusMessageNotification
                tone="error"
                message={spreadsheetImportError}
              />
            )}
          </div>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
