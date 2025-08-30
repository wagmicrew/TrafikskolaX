import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DebugPanelProps {
  bookingData: any
  debugMode: boolean
  onToggleDebug: () => void
}

export function DebugPanel({ bookingData, debugMode, onToggleDebug }: DebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    if (debugMode) {
      // Collect debug information
      setDebugInfo({
        timestamp: new Date().toISOString(),
        bookingData: {
          ...bookingData,
          // Mask sensitive information
          studentId: bookingData.studentId ? '***' + bookingData.studentId.slice(-4) : null,
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionStorage: Object.keys(sessionStorage),
        localStorage: Object.keys(localStorage),
      })
    }
  }, [debugMode, bookingData])

  if (!debugMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleDebug}
          variant="outline"
          size="sm"
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          Debug Mode
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-yellow-50 border-yellow-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-yellow-800">Debug Mode</CardTitle>
            <Button
              onClick={onToggleDebug}
              variant="ghost"
              size="sm"
              className="text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs space-y-1 max-h-60 overflow-y-auto">
            <div>
              <strong>Timestamp:</strong> {debugInfo?.timestamp}
            </div>
            <div>
              <strong>Session ID:</strong> {bookingData?.sessionId || 'None'}
            </div>
            <div>
              <strong>Total Price:</strong> {bookingData?.totalPrice || '0'} SEK
            </div>
            <div>
              <strong>Student ID:</strong> {debugInfo?.bookingData?.studentId || 'None'}
            </div>
            <div>
              <strong>Duration:</strong> {bookingData?.durationMinutes || '0'} min
            </div>
            <div>
              <strong>URL:</strong> {debugInfo?.url}
            </div>
            <div>
              <strong>Session Keys:</strong> {debugInfo?.sessionStorage?.length || 0}
            </div>
            <div>
              <strong>Local Keys:</strong> {debugInfo?.localStorage?.length || 0}
            </div>
          </div>

          <Button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
              alert('Debug info copied to clipboard!')
            }}
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs"
          >
            Copy Debug Info
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
