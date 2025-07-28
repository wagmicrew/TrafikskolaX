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
  return (
    <div className="relative">
      <div className="flex justify-between items-center max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex-1 relative">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300
                  ${
                    currentStep > step.number
                      ? "bg-green-600 text-white"
                      : currentStep === step.number
                      ? "bg-red-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }
                `}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs md:text-sm font-medium text-center
                  ${
                    currentStep >= step.number
                      ? "text-gray-800"
                      : "text-gray-500"
                  }
                `}
              >
                {step.title}
              </span>
            </div>
            
            {/* Connection line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  absolute top-5 left-1/2 w-full h-0.5 transition-all duration-300
                  ${
                    currentStep > step.number
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }
                `}
                style={{
                  left: "50%",
                  width: "calc(100% - 20px)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
