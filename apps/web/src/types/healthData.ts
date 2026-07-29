export interface HealthData {
  category_metrics: any[]
  date_range: DateRange
  export_date: string
  metadata: Metadata
  metrics: Metric[]
  workouts: Workout[]
}

export interface DateRange {
  days: number
  end: string
  start: string
}

export interface Metadata {
  aggregation_level: string
  app_version: string
  device_model: string
  export_format: string
  os_version: string
}

export interface Metric {
  aggregation_level: string
  category: string
  data_points: DataPoint[]
  display_name: string
  id: string
  unit?: string
}

export interface DataPoint {
  end_date: string
  source: Source
  start_date: string
  timestamp: string
  unit?: string
  value: number | string
}

export interface Source {
  name: string
  bundle_identifier?: string
  device?: string
}

export interface Workout {
  display_name: string
  duration: number
  end_date: string
  energy: number
  energy_unit: string
  id: string
  source: Source
  start_date: string
  type: string
}
