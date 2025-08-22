'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle, Circle } from 'lucide-react'
import { useParams } from 'next/navigation'

interface UserData {
  firstName: string
  lastName: string
  profileImage?: string
  riskEducation1?: string
  riskEducation2?: string
  knowledgeTest?: string
  drivingTest?: string
}

interface BookingStep {
  id: number
  stepNumber: number
  category: string
  subcategory: string
  description: string
  isCleared: boolean // Assuming this field is available
}

interface ApiError {
  message: string
  status: number
}

interface UserApiResponse {
  user: UserData
  success: boolean
}

interface BookingStepsApiResponse {
  steps: BookingStep[]
  success: boolean
}

function UtbildningskortClient() {
  const { user } = useAuth()
  const params = useParams()
  const userId = (params?.id as string) || user?.userId

  const [userData, setUserData] = useState<UserData | null>(null)
  const [bookingSteps, setBookingSteps] = useState<BookingStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUserData()
      fetchBookingSteps()
    }
  }, [userId])

  const fetchUserData = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: UserApiResponse = await response.json()
      if (data.success && data.user) {
        setUserData(data.user)
      } else {
        throw new Error('Invalid API response structure')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Could set an error state here
    }
  }

  const fetchBookingSteps = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/booking-steps?userId=${userId}`) // Need to implement this API
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: BookingStepsApiResponse = await response.json()
      if (data.success && data.steps) {
        setBookingSteps(data.steps)
      } else {
        throw new Error('Invalid API response structure for booking steps')
      }
    } catch (error) {
      console.error('Error fetching booking steps:', error)
      // Could set an error state here
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!userData) return <div>Kunde inte ladda användardata.</div>

  const educationProgress = [
    { label: 'Riskutbildning 1', date: userData.riskEducation1, cleared: !!userData.riskEducation1 },
    { label: 'Riskutbildning 2', date: userData.riskEducation2, cleared: !!userData.riskEducation2 },
    { label: 'Kunskapsprov', date: userData.knowledgeTest, cleared: !!userData.knowledgeTest },
    { label: 'Körprov', date: userData.drivingTest, cleared: !!userData.drivingTest },
  ]

  return (
    <div className="bg-white shadow-lg rounded-lg max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-start space-x-6 mb-8 border-b pb-6">
        <Avatar className="h-32 w-32 border-4 border-gray-200">
          <AvatarImage src={userData.profileImage} alt={`${userData.firstName} ${userData.lastName}`} />
          <AvatarFallback className="text-4xl">
            {userData.firstName?.[0] || '?'}{userData.lastName?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold text-gray-800">{userData.firstName} {userData.lastName}</h1>
          <p className="text-lg text-gray-600">Utbildningskort</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Progress Steps */}
        <div className="md:col-span-1">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Utbildningsstatus</h2>
          <div className="space-y-4">
            {educationProgress.map((item, index) => (
              <div key={index} className="flex items-center">
                {item.cleared ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300 mr-3" />
                )}
                <div>
                  <p className={`font-medium ${item.cleared ? 'text-gray-800' : 'text-gray-500'}`}>{item.label}</p>
                  {item.cleared && <p className="text-sm text-gray-500">Slutförd: {item.date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Steps */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Körutbildningssteg</h2>
          <div className="space-y-6">
            {bookingSteps.length > 0 ? (
              bookingSteps.map(step => (
                <div key={step.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {step.isCleared ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                        {step.stepNumber}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{step.category} - {step.subcategory}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>Inga körutbildningssteg tillgängliga.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UtbildningskortClient

