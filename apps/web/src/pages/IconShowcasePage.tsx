import {
  DecorativeIcon,
  type DecorativeIconProps,
} from '../components/ui/DecorativeIcon'
import { PageLayout } from '../layouts/PageLayout'

// List all icon names as strings, matching the keys expected by DecorativeIcon
const iconNames: NonNullable<DecorativeIconProps['icon']>[] = [
  // Alphabetically ordered
  'apple',
  'arrowDown',
  'arrowUp',
  'back',
  'calendar',
  'chart',
  'check',
  'circle',
  'clipboard',
  'close',
  'database',
  'document',
  'dumbbell',
  'edit',
  'grid',
  'heart',
  'help',
  'home',
  'key',
  'lock',
  'preferences',
  'search',
  'settings',
  'share',
  'shield',
  'spark',
  'spinner',
  'star',
  'tasks',
  'trash',
  'user',
  'users',
]

export function IconShowcasePage() {
  return (
    <PageLayout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        {iconNames.map((iconName) => (
          <div
            key={iconName}
            className="flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800"
          >
            {/* The type assertion is no longer needed as iconNames is now strictly typed */}
            <DecorativeIcon
              icon={iconName}
              className="h-8 w-8 text-gray-700 dark:text-gray-300 mb-2"
            />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
              {iconName}
            </span>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}
