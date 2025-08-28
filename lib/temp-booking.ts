import { BookingData } from '@/app/boka-korning/page'

interface TempBookingData {
  bookingData: BookingData
  selectedSession: any
  guestData?: any
  supervisors?: any[]
  timestamp: number
  id: string
}

const TEMP_BOOKING_KEY = 'temp_trafikskola_booking'

export class TempBookingStorage {
  private static readonly EXPIRY_TIME = 30 * 60 * 1000 // 30 minutes

  static save(bookingData: BookingData, selectedSession: any, guestData?: any, supervisors?: any[]): string {
    const id = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Convert Date objects to ISO strings for storage
    const serializableBookingData = {
      ...bookingData,
      selectedDate: bookingData.selectedDate instanceof Date ? bookingData.selectedDate.toISOString() : bookingData.selectedDate
    }

    const tempData: TempBookingData = {
      id,
      bookingData: serializableBookingData,
      selectedSession,
      guestData,
      supervisors: supervisors || [],
      timestamp: Date.now()
    }

    localStorage.setItem(TEMP_BOOKING_KEY, JSON.stringify(tempData))
    return id
  }

  static get(): TempBookingData | null {
    try {
      const data = localStorage.getItem(TEMP_BOOKING_KEY)
      if (!data) return null

      const tempData: TempBookingData = JSON.parse(data)

      // Check if expired
      if (Date.now() - tempData.timestamp > this.EXPIRY_TIME) {
        this.clear()
        return null
      }

      // Convert date strings back to Date objects
      if (tempData.bookingData && typeof tempData.bookingData.selectedDate === 'string') {
        const date = new Date(tempData.bookingData.selectedDate)
        if (!isNaN(date.getTime())) {
          tempData.bookingData.selectedDate = date
        } else {
          console.error('Invalid date string in temp booking data:', tempData.bookingData.selectedDate)
          // Keep as string if invalid, let the component handle it
        }
      }

      return tempData
    } catch (error) {
      console.error('Error reading temp booking data:', error)
      this.clear()
      return null
    }
  }

  static clear(): void {
    localStorage.removeItem(TEMP_BOOKING_KEY)
  }

  static hasValidData(): boolean {
    const data = this.get()
    return data !== null
  }

  static getId(): string | null {
    const data = this.get()
    return data?.id || null
  }

  static updateBookingData(updates: Partial<BookingData>): void {
    const current = this.get()
    if (current) {
      // Handle Date objects in updates
      const processedUpdates = { ...updates }
      if (processedUpdates.selectedDate instanceof Date) {
        processedUpdates.selectedDate = processedUpdates.selectedDate.toISOString()
      }

      current.bookingData = { ...current.bookingData, ...processedUpdates }
      current.timestamp = Date.now()
      localStorage.setItem(TEMP_BOOKING_KEY, JSON.stringify(current))
    }
  }

  static updateGuestData(guestData: any): void {
    const current = this.get()
    if (current) {
      current.guestData = guestData
      current.timestamp = Date.now()
      localStorage.setItem(TEMP_BOOKING_KEY, JSON.stringify(current))
    }
  }

  static updateSupervisors(supervisors: any[]): void {
    const current = this.get()
    if (current) {
      current.supervisors = supervisors
      current.timestamp = Date.now()
      localStorage.setItem(TEMP_BOOKING_KEY, JSON.stringify(current))
    }
  }
}
