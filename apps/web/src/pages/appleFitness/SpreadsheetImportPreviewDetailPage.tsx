import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import {
  updateSpreadsheetImportPreviewDate,
  updateSpreadsheetImportPreviewDuration,
  updateSpreadsheetImportPreviewItem,
  type SpreadsheetWorkoutImportPreviewItem,
} from '../../features/importedWorkouts/domain/spreadsheetWorkoutImport'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'

export const SpreadsheetImportPreviewDetailPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { index } = useParams()
  const itemIndex = typeof index === 'string' ? Number(index) : NaN

  const [previewItems, setPreviewItems] = useState<
    SpreadsheetWorkoutImportPreviewItem[] | null
  >(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gym-pilot:spreadsheetImportPreview')
      if (!raw) {
        setPreviewItems(null)
        return
      }
      const parsed = JSON.parse(raw) as SpreadsheetWorkoutImportPreviewItem[]
      setPreviewItems(parsed)
    } catch {
      setPreviewItems(null)
    }
  }, [])

  if (!user?.id) {
    return (
      <PageLayout className="gap-6">
        <PageCardLayout
          title="Preview detail"
          description="You must be logged in to edit preview items."
          icon="apple"
        >
          <div>Please sign in</div>
        </PageCardLayout>
      </PageLayout>
    )
  }

  if (
    !previewItems ||
    Number.isNaN(itemIndex) ||
    itemIndex < 0 ||
    itemIndex >= previewItems.length
  ) {
    return (
      <PageLayout className="gap-6">
        <PageCardLayout
          title="Preview detail"
          description="No preview item found."
          icon="apple"
        >
          <div className="text-sm">
            No preview item available. Return to the preview list.
          </div>
          <div className="mt-4">
            <Button
              onClick={() =>
                navigate('/apple-fitness/import-spreadsheet/preview')
              }
              tone="default"
            >
              Back to preview
            </Button>
          </div>
        </PageCardLayout>
      </PageLayout>
    )
  }

  const item = previewItems[itemIndex]

  const saveAndBack = () => {
    try {
      localStorage.setItem(
        'gym-pilot:spreadsheetImportPreview',
        JSON.stringify(previewItems),
      )
    } catch {
      // ignore
    }
    navigate('/apple-fitness/import-spreadsheet/preview')
  }

  return (
    <PageLayout className="gap-6">
      <PageCardLayout
        title={`Edit imported session ${itemIndex + 1}`}
        description="Adjust date, duration and review exercises."
        icon="apple"
      >
        <div className="rounded border border-slate-200 p-3 dark:border-slate-700">
          <label className="flex items-center gap-2">
            <span className="text-sm">Date</span>
            <input
              type="date"
              value={item.payload.session.start_at.slice(0, 10)}
              onChange={(e) => {
                const nextDate = e.target.value
                if (!nextDate) return
                const nextStartAt = new Date(
                  `${nextDate}T00:00:00`,
                ).toISOString()
                setPreviewItems((current) =>
                  current
                    ? updateSpreadsheetImportPreviewItem(current, itemIndex, {
                        payload: updateSpreadsheetImportPreviewDate(
                          current[itemIndex].payload,
                          nextStartAt,
                        ),
                      })
                    : current,
                )
              }}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <label className="mt-3 flex items-center gap-2">
            <span className="text-sm">Duration (min)</span>
            <input
              type="number"
              min="0"
              value={item.payload.session.duration_minutes ?? ''}
              onChange={(e) => {
                const nextValue = e.target.value
                const parsedValue = nextValue === '' ? null : Number(nextValue)
                const nextDuration = Number.isNaN(parsedValue)
                  ? null
                  : parsedValue
                setPreviewItems((current) =>
                  current
                    ? updateSpreadsheetImportPreviewItem(current, itemIndex, {
                        payload: updateSpreadsheetImportPreviewDuration(
                          current[itemIndex].payload,
                          nextDuration,
                        ),
                      })
                    : current,
                )
              }}
              className="w-24 rounded border border-slate-300 bg-white px-1 py-1 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <div className="mt-3">
            <p className="text-xs font-medium">Exercises</p>
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 dark:text-slate-400">
              {item.payload.workout_items.map((wi) => (
                <li key={`${wi.exercise_name}-${wi.item_index}`}>
                  {wi.exercise_name}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              tone="default"
              onClick={() =>
                navigate('/apple-fitness/import-spreadsheet/preview')
              }
            >
              Cancel
            </Button>
            <Button tone="emerald" onClick={saveAndBack}>
              Save
            </Button>
          </div>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}

export default SpreadsheetImportPreviewDetailPage
