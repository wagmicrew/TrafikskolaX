import { Button as FBButton, Label as FBLabel } from 'flowbite-react'

interface HandledareRecapProps {
  allowsSupervisors: boolean
  supervisorCount: number
  pricePerSupervisor: number
  onSupervisorCountChange: (count: number) => void
  formatPrice: (price: number) => string
}

export function HandledareRecap({
  allowsSupervisors,
  supervisorCount,
  pricePerSupervisor,
  onSupervisorCountChange,
  formatPrice,
}: HandledareRecapProps) {
  if (!allowsSupervisors || supervisorCount === 0) {
    return null
  }

  return (
    <div className="bg-blue-50 p-6 rounded-xl mb-6 border border-blue-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Handledare</h3>
      <p className="text-sm text-gray-800 mb-4 font-medium">
        Grundpriset inkluderar en student och en handledare.
        Du kan lägga till ytterligare handledare för {formatPrice(pricePerSupervisor)} SEK per person.
      </p>

      <div className="flex items-center space-x-4 mb-4">
        <FBLabel className="text-sm font-medium text-gray-800">Antal handledare:</FBLabel>
        <div className="flex items-center space-x-2">
          <FBButton
            type="button"
            color="light"
            onClick={() => onSupervisorCountChange(Math.max(0, supervisorCount - 1))}
            disabled={supervisorCount <= 0}
            className="w-8 h-8 p-0"
          >
            -
          </FBButton>
          <span className="w-8 text-center font-semibold">{supervisorCount}</span>
          <FBButton
            type="button"
            color="light"
            onClick={() => onSupervisorCountChange(supervisorCount + 1)}
            className="w-8 h-8 p-0"
          >
            +
          </FBButton>
        </div>
        {pricePerSupervisor > 0 && (
          <span className="text-sm text-gray-600">
            ({formatPrice(pricePerSupervisor)} SEK per handledare)
          </span>
        )}
      </div>
    </div>
  )
}
