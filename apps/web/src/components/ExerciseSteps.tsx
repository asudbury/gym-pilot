type ExerciseStepsProps = {
  steps: string[],
  className?: string
}

export function ExerciseSteps({
  steps,
  className,
}: ExerciseStepsProps) {
  return (
    <ol className={`text-slate-600 ${className ?? ''}`}>
      {steps.map((step, index) => (
        <li key={index} className="mt-2 flex items-start gap-2">
          <span className="mt-0.5 inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}
