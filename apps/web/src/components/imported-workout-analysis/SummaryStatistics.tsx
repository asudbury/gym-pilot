
interface SummaryStatisticsProps {
  totalWorkouts: number
  totalDuration: number
  totalEnergy: number
  avgWorkoutsPerWeek: number
  avgEnergyPerWeek: number
  avgDuration: number
}

export function SummaryStatistics({
  totalWorkouts,
  totalDuration,
  totalEnergy,
  avgWorkoutsPerWeek,
  avgEnergyPerWeek,
  avgDuration,
}: SummaryStatisticsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
      <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-lg font-semibold">Total Workouts</h2>
        <p className="text-2xl font-bold">{totalWorkouts.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-m font-semibold">Total Duration (minutes)</h2>
        <p className="text-2xl font-bold">
          {Number((totalDuration / 60).toFixed(0)).toLocaleString()}
        </p>
      </div>
      <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-m font-semibold">Total Energy (kcal)</h2>
        <p className="text-2xl font-bold">
          {Number(totalEnergy.toFixed(0)).toLocaleString()}
        </p>
      </div>
      <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-m font-semibold">Avg Workouts / Week</h2>
        <p className="text-2xl font-bold">
          {Number(avgWorkoutsPerWeek).toLocaleString()}
        </p>
      </div>
      <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-m font-semibold">Avg Energy / Week (kcal)</h2>
        <p className="text-2xl font-bold">
          {Number(avgEnergyPerWeek).toLocaleString()}
        </p>
      </div>
      <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-m font-semibold">Avg Duration (minutes)</h2>
        <p className="text-2xl font-bold">
          {Number(avgDuration).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
