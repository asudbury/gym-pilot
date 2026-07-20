import { getToneClass } from './toneClasses'
import { Button } from './Button'
import { normalizeFolderName, type QuickLink } from '../utils/favouriteUtils'

type FavouriteFolderGroupProps = {
  folderName: string
  items: QuickLink[]
  folderOptions: string[]
  isExpanded: boolean
  onToggle: (folderName: string) => void
  onDeleteFolder: (folderName: string) => void
  onMoveLink: (link: QuickLink, folderName: string) => void
  onOpenLink: (link: QuickLink) => void
  onRemoveLink: (link: QuickLink) => void
}

export function FavouriteFolderGroup({
  folderName,
  items,
  folderOptions,
  isExpanded,
  onToggle,
  onDeleteFolder,
  onMoveLink,
  onOpenLink,
  onRemoveLink,
}: FavouriteFolderGroupProps) {
  const isCollapsed = !isExpanded

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'copy'
        event.dataTransfer.setData(
          'application/x-gym-pilot-links',
          JSON.stringify({ folderName, items }),
        )
        event.dataTransfer.setData(
          'text/plain',
          JSON.stringify({ folderName, items }),
        )
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          onClick={() => onToggle(folderName)}
          className="flex items-center gap-2 text-left text-sm font-semibold tracking-wide text-slate-600"
        >
          <span className="text-base text-slate-400">
            {isCollapsed ? '▶' : '▼'}
          </span>
          <span>{folderName}</span>
        </Button>
        <div className="flex items-center gap-2">
          {folderName !== 'No folder' && (
            <Button
              type="button"
              onClick={() => onDeleteFolder(folderName)}
              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
            >
              Delete folder
            </Button>
          )}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {items.length}
          </span>
        </div>
      </div>
      {!isCollapsed && (
        <div className="ml-3 flex flex-col gap-2 border-l border-slate-200 pl-3">
          {items.map((link) => (
            <div
              key={link.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <Button
                type="button"
                onClick={() => onOpenLink(link)}
                className="flex-1 text-left"
                draggable
                onDragStart={(event) => {
                  event.stopPropagation()
                  event.dataTransfer.effectAllowed = 'copy'
                  event.dataTransfer.setData(
                    'application/x-gym-pilot-links',
                    JSON.stringify([{ label: link.label, path: link.path }]),
                  )
                  event.dataTransfer.setData(
                    'text/plain',
                    JSON.stringify([{ label: link.label, path: link.path }]),
                  )
                }}
              >
                <div className="text-sm font-semibold text-slate-900">
                  {link.label}
                </div>
                <div className="mt-1 text-xs text-slate-500">{link.path}</div>
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="sr-only">Folder</span>
                  <select
                    value={
                      normalizeFolderName(link.folder ?? '') || 'No folder'
                    }
                    onChange={(event) => onMoveLink(link, event.target.value)}
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="">No folder</option>
                    {folderOptions.map((folderOption) => (
                      <option key={folderOption} value={folderOption}>
                        {folderOption}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  onClick={() => onOpenLink(link)}
                  className={getToneClass('default', 'rounded-lg px-3 py-2 text-sm font-medium')}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  onClick={() => onRemoveLink(link)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
