import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'

const helpSections = [
  // {
  //   title: 'Getting started',
  //   items: [
  //     'Use the Home screen to browse exercises and save favorites for quicker access.',
  //     'Create a base plan from the Plans area before assigning it to a user.',
  //   ],
  // },
  {
    title: 'Searching and favourites',
    items: [
      'Use the search box on the Home page to quickly find exercises by name or type.',
      'Tap the favourite button on an exercise card to save it for fast access later.',
      'Your favourites appear in the header menu so you can jump straight back to the exercises you use most often.',
    ],
  },
  {
    title: 'Exercises',
    items: [
      'Open an exercise to view its details, instructions, and related information.',
      'Use the YouTube search option to find videos for the exercise when you want extra guidance.',
      'Each exercise also includes an animated GIF so you can see the movement clearly.',
      'You can copy the exercise URL from the browser address bar to share a specific exercise with someone else.',
    ],
  },
  {
    title: 'Plans',
    items: [
      'Use Plans to build reusable workout templates with exercises, notes, and tabs.',
      'Create a plan from scratch or edit an existing one before you assign it to someone.',
      'Plans act as the shared base that can later be used to create individual assignments.',
    ],
  },
  {
    title: 'Assignments',
    items: [
      'Create a new assignment from the Assignments page and choose a user plus a base plan.',
      'Open an assignment to review, edit, or export it as an Excel workbook.',
    ],
  },
  {
    title: 'Admin tools',
    items: [
      'Use Admin to manage users, review stored data, and adjust preferences.',
      'The database view helps you inspect the current local records used by the app.',
    ],
  },
]

export function HelpPage() {
  return (
    <PageLayout>
      <PageCard>
        <div className="space-y-4">
          <div>
            <Paragraph>Support</Paragraph>
            <Heading1 className="mt-2">How to use GymPilot</Heading1>
          </div>

          <div className="flex flex-col gap-4">
            {helpSections.map((section) => (
              <div key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="leading-6">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}
