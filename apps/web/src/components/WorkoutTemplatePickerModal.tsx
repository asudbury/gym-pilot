import { getSupabaseClient } from '@gym-pilot/shared';
import type { Tables } from '@gym-pilot/shared/src/dataServices/databaseTypes';
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames';
import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { StatusMessageNotification } from './ui/StatusMessageNotification';

type WorkoutTemplate = Tables<typeof TableNames.WorkoutTemplate> & {
  workout_template_exercise: Array<
    Tables<typeof TableNames.WorkoutTemplateExercise>
  >
}

interface WorkoutTemplatePickerModalProps {
  isOpen: boolean
  onSelectTemplate: (template: WorkoutTemplate) => void
  onCancel: () => void
}

export function WorkoutTemplatePickerModal({
  isOpen,
  onSelectTemplate,
  onCancel,
}: WorkoutTemplatePickerModalProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    if (!isOpen) return

    async function loadTemplates() {
      setLoading(true)
      setError(null)
      const client = getSupabaseClient()
      if (!client) {
        setError('Supabase client not available.')
        setLoading(false)
        return
      }

      const { data, error } = await client
        .from(TableNames.WorkoutTemplate)
        .select('*, workout_template_exercise(*)')
        .order('name', { ascending: true })

      if (error) {
        console.error('Could not load workout templates', error)
        setError(error.message)
        setTemplates([])
      } else {
        setTemplates(data as WorkoutTemplate[])
      }
      setLoading(false)
    }

    void loadTemplates()
  }, [isOpen])

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(filterText.toLowerCase()) ||
      t.description?.toLowerCase().includes(filterText.toLowerCase()),
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">
          Select a Workout Template
        </h2>
        <input
          type="text"
          placeholder="Search templates..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="mt-4 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {loading && (
          <p className="mt-4 text-sm text-slate-600">Loading templates...</p>
        )}
        {error && (
          <StatusMessageNotification
            message={error}
            tone="error"
            className="mt-4"
          />
        )}
        {!loading && !error && filteredTemplates.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">No templates found.</p>
        )}
        <ul className="mt-4 max-h-80 overflow-y-auto space-y-2">
          {filteredTemplates.map((template) => (
            <li key={template.id}>
              <Button
                tone="default"
                className="w-full justify-start text-left"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{template.name}</span>
                  {template.description && (
                    <span className="text-xs text-slate-500">
                      {template.description}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    Exercises: {template.workout_template_exercise?.length || 0}
                  </span>
                </div>
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button tone="default" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
