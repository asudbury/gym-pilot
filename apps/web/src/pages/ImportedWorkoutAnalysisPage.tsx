
import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageCard } from '../components/PageCard';
import { useImportedWorkouts } from '../hooks/useImportedWorkouts';
import { PageLayout } from '../layouts/PageLayout';

type FilterType = 'thisWeek' | 'thisMonth' | 'thisYear' | 'all' | 'custom';
type DateRange = [Date, Date];

export function ImportedWorkoutAnalysisPage() {
  const { workouts, loading } = useImportedWorkouts();
  const [filter, setFilter] = useState<FilterType>('all');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  const filteredWorkouts = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(
      now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    );
    const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    switch (filter) {
      case 'thisWeek':
        return workouts.filter((w) => {
          const date = new Date(w.start_date);
          return date >= startOfWeek && date <= endOfWeek;
        });
      case 'thisMonth':
        return workouts.filter((w) => {
          const date = new Date(w.start_date);
          return date >= startOfMonth && date <= endOfMonth;
        });
      case 'thisYear':
        return workouts.filter((w) => {
          const date = new Date(w.start_date);
          return date >= startOfYear && date <= endOfYear;
        });
      case 'custom':
        if (customRange) {
          const [start, end] = customRange;
          return workouts.filter((w) => {
            const date = new Date(w.start_date);
            return date >= start && date <= end;
          });
        }
        return workouts;
      case 'all':
      default:
        return workouts;
    }
  }, [workouts, filter, customRange]);

  const totalWorkouts = filteredWorkouts.length;
  const totalDuration = filteredWorkouts.reduce(
    (sum, w) => sum + w.duration,
    0
  );
  const totalEnergy = filteredWorkouts.reduce((sum, w) => sum + w.energy, 0);

  const workoutsByWeek = filteredWorkouts.reduce((acc, workout) => {
    const date = new Date(workout.start_date);
    const year = date.getFullYear();
    const week = Math.ceil(
      ((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    );
    const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
    acc[weekKey] = (acc[weekKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weeklyChartData = Object.entries(workoutsByWeek)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const workoutsByName = filteredWorkouts.reduce((acc, workout) => {
    const name = workout.display_name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nameChartData = Object.entries(workoutsByName)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <PageLayout>
        <PageCard>
          <p>Loading...</p>
        </PageCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="gap-6">
      <PageCard as="section" className="space-y-6">
        <h1 className="text-2xl font-bold">Imported Workout Analysis</h1>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')}>All</button>
          <button onClick={() => setFilter('thisWeek')}>This Week</button>
          <button onClick={() => setFilter('thisMonth')}>This Month</button>
          <button onClick={() => setFilter('thisYear')}>This Year</button>
          <button onClick={() => setFilter('custom')}>Custom Range</button>
        </div>

        {filter === 'custom' && (
          <div>
            <Calendar
              onChange={(value) => setCustomRange(value as DateRange)}
              value={customRange}
              selectRange={true}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
            <h2 className="text-lg font-semibold">Total Workouts</h2>
            <p className="text-3xl font-bold">{totalWorkouts}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
            <h2 className="text-lg font-semibold">Total Duration (minutes)</h2>
            <p className="text-3xl font-bold">
              {(totalDuration / 60).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
            <h2 className="text-lg font-semibold">Total Energy (kcal)</h2>
            <p className="text-3xl font-bold">{totalEnergy.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Workouts per Week</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Workouts" />
            </BarChart>
          </ResponsiveContainer>
        </div>

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
      </PageCard>
    </PageLayout>
  );
}
