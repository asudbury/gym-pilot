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
          <li key={index} className="mt-2"><b>{index + 1}.</b>{' '}{step}</li>
        ))}
      </ol>
  )
}
