import { PageCard } from '../components/PageCard'
import { Heading1, Paragraph } from '../components/Typography'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'

export function HelpPage() {
  return (
    <PageLayout>
      <PageCardLayout
        title="Help"
        subtitle="How to use Gym Pilot"
        description="A brief guide for business users and trainers."
      >
        <PageCard padding="spacious">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="help" />
            <div>
              <Paragraph>Quick Help</Paragraph>
              <Heading1 className="mt-2">Using Gym Pilot</Heading1>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="text-base font-semibold">Purpose</h3>
            <p className="text-sm text-slate-700">
              Gym Pilot helps trainers and managers build repeatable workout
              plans from reusable workout templates, assign plans to members,
              and record session activity.
            </p>

            <h3 className="text-base font-semibold">Core concepts</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              <li>
                <strong>Workout Template:</strong> a saved list of exercises
                (the building block).
              </li>
              <li>
                <strong>Plan:</strong> a collection of workout templates
                arranged into days/tabs.
              </li>
              <li>
                <strong>Assignment:</strong> a plan given to a member or cohort
                for a period.
              </li>
              <li>
                <strong>Session:</strong> a recorded training instance linked
                back to a template.
              </li>
            </ul>

            <h3 className="text-base font-semibold">Common workflows</h3>
            <ol className="list-decimal pl-5 text-sm text-slate-700">
              <li>
                Create a Workout Template: Templates → Create, add exercises,
                save.
              </li>
              <li>
                Build a Plan: Plans → Create, add templates to days/tabs, save.
              </li>
              <li>
                Assign a Plan: select a plan and assign to a member/group with
                dates.
              </li>
              <li>
                Record Sessions: use the Sessions area to log performed
                workouts.
              </li>
            </ol>

            <h3 className="text-base font-semibold">Admin notes</h3>
            <p className="text-sm text-slate-700">
              Admins can manage users, roles, and override templates. Database
              migrations live in <code>supabase/migrations</code> and are
              applied with <code>supabase db push</code>.
            </p>

            <h3 className="text-base font-semibold">Support</h3>
            <p className="text-sm text-slate-700">
              For product questions, contact your product owner. For technical
              support (deployments, migrations), contact the engineering lead
              and reference the repo.
            </p>
          </div>
        </PageCard>
      </PageCardLayout>
    </PageLayout>
  )
}

export default HelpPage
