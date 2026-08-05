import { describe, expect, it } from 'vitest'
import {
  buildSpreadsheetWorkoutImportPayloads,
  getSelectedSpreadsheetImportPayloads,
  type SpreadsheetWorkoutImportPreviewItem,
  updateSpreadsheetImportPreviewDate,
  updateSpreadsheetImportPreviewDuration,
} from './spreadsheetWorkoutImport'

describe('buildSpreadsheetWorkoutImportPayloads', () => {
  it('builds session and workout item payloads from a Numbers-style table', () => {
    const csv = `Exercise	Reps	Working sets	Week 1	Week 2	Week 3
DATE	-	-	21st Jun	23rd Jun	30th Jun
1km ski/row warm up and mobility	-	-	Ski 5m 30s	Row 5m 11s	Ski 4m 54s
Shoulder press machine (seat height 6)	1-4	3	30kg(x2) x4	25kg x 2	Missed
Time + calories	-	-	0:52 318kcal	78m 391kcal	76m 374kcal`

    const payloads = buildSpreadsheetWorkoutImportPayloads(csv, {
      userId: 'user-1',
      referenceYear: 2026,
    })

    expect(payloads).toHaveLength(3)

    expect(payloads[0]?.session.start_at).toBe('2026-06-21T00:00:00.000Z')
    expect(payloads[0]?.session.notes).toContain('Imported')
    expect(payloads[0]?.workout_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exercise_name: '1km ski/row warm up and mobility',
          category: 'warm_up',
          notes: 'Ski 5m 30s',
        }),
        expect.objectContaining({
          exercise_name: 'Shoulder press machine (seat height 6)',
          category: 'exercise',
          notes: '30kg(x2) x4',
        }),
      ]),
    )

    expect(payloads[0]?.session.metadata).toEqual(
      expect.objectContaining({
        source: 'numbers',
        summary: '0:52 318kcal',
      }),
    )
  })

  it('parses duration values from summary text', () => {
    const input = `Exercise	Reps	Working sets	Week 1
DATE	-	-	21st Jun
Shoulder press machine (seat height 6)	1-4	3	30kg(x2) x4
Time + calories	-	-	20 mins 318kcal`

    const payloads = buildSpreadsheetWorkoutImportPayloads(input, {
      userId: 'user-1',
      referenceYear: 2026,
    })

    expect(payloads[0]?.session.duration_minutes).toBe(20)
  })

  it('parses comma-separated csv input', () => {
    const csv = `Exercise,Reps,Working sets,Week 1
DATE,-,-,21st Jun
Shoulder press machine (seat height 6),1-4,3,30kg(x2) x4
Time + calories,-,-,0:52 318kcal`

    const payloads = buildSpreadsheetWorkoutImportPayloads(csv, {
      userId: 'user-1',
      referenceYear: 2026,
    })

    expect(payloads).toHaveLength(1)
    expect(payloads[0]?.workout_items[0]?.exercise_name).toBe(
      'Shoulder press machine (seat height 6)',
    )
    expect(payloads[0]?.session.metadata).toEqual(
      expect.objectContaining({
        source: 'numbers',
        summary: '0:52 318kcal',
      }),
    )
  })

  it('parses headerless date-first table layouts', () => {
    const input = `DATE	-\t-\t21st Jun\t23rd Jun\t30th Jun
1km ski/row warm up and mobility\t-\t-\tSki 5m 30s\tRow 5m 11s\tSki 4m 54s
Shoulder press machine (seat height 6)\t1-4\t3\t30kg(x2) x4\t25kg x 2\tMissed
Time + calories\t-\t-\t0:52 318kcal\t78m 391kcal\t76m 374kcal`

    const payloads = buildSpreadsheetWorkoutImportPayloads(input, {
      userId: 'user-1',
      referenceYear: 2026,
    })

    expect(payloads).toHaveLength(3)
    expect(payloads[0]?.session.start_at).toBe('2026-06-21T00:00:00.000Z')
    expect(payloads[2]?.workout_items[0]?.exercise_name).toBe(
      '1km ski/row warm up and mobility',
    )
  })

  it('updates the preview duration override for a payload', () => {
    const payload = {
      session: {
        user_id: 'user-1',
        session_id: 'session-1',
        session_type: 'solo' as const,
        start_at: '2026-06-21T00:00:00.000Z',
        duration_minutes: null,
        trainer_id: null,
        trainer_name: null,
        class_id: null,
        class_name: null,
        location: null,
        capacity: null,
        price: null,
        metadata: {},
        role: 'client' as const,
        status: 'attended' as const,
        notes: null,
        rating: null,
        attendance_type: 'attended' as const,
      },
      workout_items: [],
    }

    const updatedPayload = updateSpreadsheetImportPreviewDuration(payload, 45)

    expect(updatedPayload.session.duration_minutes).toBe(45)
  })

  it('updates the preview start date override for a payload', () => {
    const payload = {
      session: {
        user_id: 'user-1',
        session_id: 'session-1',
        session_type: 'solo' as const,
        start_at: '2026-06-21T00:00:00.000Z',
        duration_minutes: null,
        trainer_id: null,
        trainer_name: null,
        class_id: null,
        class_name: null,
        location: null,
        capacity: null,
        price: null,
        metadata: {},
        role: 'client' as const,
        status: 'attended' as const,
        notes: null,
        rating: null,
        attendance_type: 'attended' as const,
      },
      workout_items: [],
    }

    const updatedPayload = updateSpreadsheetImportPreviewDate(
      payload,
      '2026-06-28T00:00:00.000Z',
    )

    expect(updatedPayload.session.start_at).toBe('2026-06-28T00:00:00.000Z')
  })

  it('returns only the selected preview payloads', () => {
    const previewItems: SpreadsheetWorkoutImportPreviewItem[] = [
      {
        payload: {
          session: {
            user_id: 'user-1',
            session_id: 'session-1',
            session_type: 'solo',
            start_at: '2026-06-21T00:00:00.000Z',
            duration_minutes: null,
            trainer_id: null,
            trainer_name: null,
            class_id: null,
            class_name: null,
            location: null,
            capacity: null,
            price: null,
            metadata: {},
            role: 'client',
            status: 'attended',
            notes: null,
            rating: null,
            attendance_type: 'attended',
          },
          workout_items: [],
        },
        selected: true,
      },
      {
        payload: {
          session: {
            user_id: 'user-1',
            session_id: 'session-2',
            session_type: 'solo',
            start_at: '2026-06-22T00:00:00.000Z',
            duration_minutes: null,
            trainer_id: null,
            trainer_name: null,
            class_id: null,
            class_name: null,
            location: null,
            capacity: null,
            price: null,
            metadata: {},
            role: 'client',
            status: 'attended',
            notes: null,
            rating: null,
            attendance_type: 'attended',
          },
          workout_items: [],
        },
        selected: false,
      },
    ]

    const selectedPayloads = getSelectedSpreadsheetImportPayloads(previewItems)

    expect(selectedPayloads).toHaveLength(1)
    expect(selectedPayloads[0]?.session.session_id).toBe('session-1')
  })

  it('supports multiple workbook-style sheets', () => {
    const payloads = buildSpreadsheetWorkoutImportPayloads(
      {
        sheets: [
          {
            name: 'Week 1',
            rows: [
              ['Exercise', 'Reps', 'Working sets', 'Week 1'],
              ['DATE', '-', '-', '21st Jun'],
              ['Lat pull down machine', '4-8', '3', '40kg x 2'],
              ['Time + calories', '-', '-', '0:52 318kcal'],
            ],
          },
          {
            name: 'Week 2',
            rows: [
              ['Exercise', 'Reps', 'Working sets', 'Week 1'],
              ['DATE', '-', '-', '23rd Jun'],
              ['DB bench press', '4-8', '3', '60kg'],
              ['Time + calories', '-', '-', '78m 391kcal'],
            ],
          },
        ],
      },
      {
        userId: 'user-1',
        referenceYear: 2026,
      },
    )

    expect(payloads).toHaveLength(2)
    expect(payloads[0]?.session.metadata).toEqual(
      expect.objectContaining({
        sheet_name: 'Week 1',
      }),
    )
    expect(payloads[1]?.workout_items[0]?.exercise_name).toBe('DB bench press')
  })
})
