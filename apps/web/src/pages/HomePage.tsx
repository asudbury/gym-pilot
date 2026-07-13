import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExerciseMetaBadges } from '../components/ExerciseMetaBadges'
import { getToneClass } from '../components/toneClasses'
import { exercises, exercisesSchema, formatLabel } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageActionRow } from '../components/PageActionRow'
import { PageLayout } from '../layouts/PageLayout'
import { Heading2 } from '../components/Typography'
import { appTokens } from '../styles/tokens'
import { getAssetUrl } from '../utils/assetUrl'

export function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const { exerciseList, categories, equipment, totalExercises } = useMemo(() => {
    const parsed = exercisesSchema.parse(exercises)

    return {
      exerciseList: parsed,
      categories: ['All', ...Array.from(new Set(parsed.map((exercise) => formatLabel(exercise.category))))],
      equipment: ['All', ...Array.from(new Set(parsed.map((exercise) => formatLabel(exercise.equipment))))],
      totalExercises: parsed.length,
    }
  }, [])

  const handleCopyUrl = async (exerciseId: string) => {
    const url = `${window.location.origin}/exercise/${exerciseId}`

    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(exerciseId)
      window.setTimeout(() => setCopiedId((current) => (current === exerciseId ? null : current)), 1500)
    } catch {
      setCopiedId(null)
    }
  }

  const filteredExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return exerciseList.filter((exercise) => {
      const matchesCategory = selectedCategory === 'All' || formatLabel(exercise.category) === selectedCategory
      const matchesEquipment = selectedEquipment === 'All' || formatLabel(exercise.equipment) === selectedEquipment
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [exercise.name, exercise.category, exercise.target, exercise.equipment].join(' ').toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesEquipment && matchesSearch
    })
  }, [exerciseList, searchTerm, selectedCategory, selectedEquipment])

  return (
    <PageLayout className="gap-6">
      <PageCard as="section">
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="exercise-search">
            Search exercises
          </label>
          <input
            id="exercise-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Try abs, chest, cable..."
            className={`${appTokens.input} outline-none ring-0 focus:border-slate-400`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory((current) => (current === category ? 'All' : category))}
              className={`${
                category === selectedCategory
                  ? getToneClass('blue', 'px-4 py-2 text-sm font-medium transition')
                  : getToneClass('default', 'px-4 py-2 text-sm font-medium transition hover:bg-slate-200')
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          {equipment.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedEquipment((current) => (current === item ? 'All' : item))}
              className={`${
                item === selectedEquipment
                  ? getToneClass('orange', 'px-3 py-2 text-sm')
                  : getToneClass('default', 'px-3 py-2 text-sm hover:bg-slate-200')
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </PageCard>

      <PageCard as="section">
        <PageActionRow className="mb-5 border-b border-slate-200 pb-4">
          <div>
            <Heading2>Exercises</Heading2>
            <p className="text-sm text-slate-600">Showing {filteredExercises.length} of {totalExercises} exercises.</p>
          </div>
          <div className={appTokens.pill}>{selectedCategory !== 'All' ? `Category: ${selectedCategory}` : 'All categories'}</div>
        </PageActionRow>

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className={`flex cursor-pointer gap-4 ${appTokens.surfaceSoft} p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md`}
            >
              <Link to={`/exercise/${exercise.id}`} className="flex min-w-0 flex-1 gap-4">
                <img src={getAssetUrl(exercise.image)} alt={exercise.name} className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{formatLabel(exercise.name)}</h3>
                  <ExerciseMetaBadges
                    values={[formatLabel(exercise.category), formatLabel(exercise.equipment)]}
                    tones={['blue', 'orange']}
                    className="mt-2"
                    pillClassName="text-xs"
                  />
                </div>
              </Link>
              <div className="flex shrink-0 flex-col gap-2 self-start">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void handleCopyUrl(exercise.id)
                  }}
                  className={getToneClass('white', 'px-3 py-2 text-sm font-medium')}
                >
                  {copiedId === exercise.id ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </PageCard>
    </PageLayout>
  )
}
