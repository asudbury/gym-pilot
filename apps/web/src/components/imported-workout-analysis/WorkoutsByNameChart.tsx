import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface ChartData {
  name: string
  count: number
}

interface WorkoutsByNameChartProps {
  nameChartData: ChartData[]
}

export function WorkoutsByNameChart({
  nameChartData,
}: WorkoutsByNameChartProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Workouts by Name</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={nameChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#82ca9d" name="Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
