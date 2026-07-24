import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listBookings } from '@gym-pilot/shared'
import { PageLayout } from '../layouts/PageLayout'
import { PageCardLayout } from '../layouts/PageCardLayout'

export function TrainerReportPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void (async () => {
      setLoading(true)
      try {
        const entries = await listBookings({ trainerId: user?.id })
        if (!active) return
        setBookings(entries)
      } catch (err) {
        // ignore
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [user?.id])

  return (
    <PageLayout>
      <PageCardLayout title="Trainer report">
        <div>
          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : bookings.length === 0 ? (
            <div className="text-sm text-slate-600">No sessions found.</div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="rounded-2xl border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {b.session?.class_name || b.session?.session_type}
                      </div>
                      <div className="text-sm text-slate-500">
                        {b.session?.start_at}
                      </div>
                      <div className="text-sm text-slate-500">
                        Client: {b.user_id}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">{b.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}

export default TrainerReportPage
