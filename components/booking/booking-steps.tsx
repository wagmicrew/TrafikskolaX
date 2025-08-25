"use client"

import { Check } from "lucide-react"

interface Step {
  number: number
  title: string
}

interface BookingStepsProps {
  currentStep: number
  steps: Step[]
}

export function BookingSteps({ currentStep, steps }: BookingStepsProps) {
  const activeIndex = Math.max(0, steps.findIndex(s => s.number === currentStep))
  return (
    <nav className="relative px-4 sm:px-6 lg:px-8" aria-label="Bokningssteg">
      <ol className="flex justify-between items-center max-w-3xl mx-auto">
        {steps.map((step, index) => {
          const isComplete = index < activeIndex
          const isActive = index === activeIndex
          const displayStepNumber = index + 1
          return (
            <li key={step.number} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`${displayStepNumber}. ${step.title}`}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${isComplete ? 'bg-green-600 text-white' : isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-700'}`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    displayStepNumber
                  )}
                </div>
                <span className={`mt-1 sm:mt-2 text-[10px] sm:text-xs md:text-sm font-semibold text-center px-1 tracking-tight ${isComplete || isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`absolute top-4 sm:top-5 left-1/2 w-full h-0.5 transition-all duration-300 -z-10 ${isComplete ? 'bg-green-600' : 'bg-gray-300'}`}
                  style={{ left: '50%', width: 'calc(100% - 20px)' }}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
