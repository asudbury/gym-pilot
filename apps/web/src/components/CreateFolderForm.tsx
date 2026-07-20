import { Panel } from './ui/Panel'
import { Button } from './Button'

type CreateFolderFormProps = {
  newFolderName: string
  onNewFolderNameChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function CreateFolderForm({
  newFolderName,
  onNewFolderNameChange,
  onSubmit,
}: CreateFolderFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <Panel variant="muted" padding="md" className="flex-1">
        <label
          htmlFor="new-folder-name"
          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          Create folder
        </label>
        <input
          id="new-folder-name"
          value={newFolderName}
          onChange={(event) => onNewFolderNameChange(event.target.value)}
          placeholder="e.g. Workout plans"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ring-0 focus:border-slate-400"
        />
      </Panel>
      <Button type="submit" className="rounded-xl px-4 py-2 text-sm font-medium">
        Add folder
      </Button>
    </form>
  )
}
