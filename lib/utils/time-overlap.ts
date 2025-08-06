/**
 * Utility functions for checking time overlaps between bookings and slots
 */

/**
 * Check if two time ranges overlap
 * @param start1 Start time of first range (HH:MM format)
 * @param end1 End time of first range (HH:MM format)
 * @param start2 Start time of second range (HH:MM format)
 * @param end2 End time of second range (HH:MM format)
 * @returns true if the ranges overlap, false otherwise
 */
export function doTimeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert times to minutes for easier comparison
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  // Check for overlap: two ranges overlap if one starts before the other ends
  // and the other starts before the first ends
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

/**
 * Check if a booking overlaps with a slot
 * @param bookingStart Booking start time (HH:MM format)
 * @param bookingEnd Booking end time (HH:MM format)
 * @param slotStart Slot start time (HH:MM format)
 * @param slotEnd Slot end time (HH:MM format)
 * @returns true if the booking overlaps with the slot, false otherwise
 */
export function doesBookingOverlapWithSlot(
  bookingStart: string,
  bookingEnd: string,
  slotStart: string,
  slotEnd: string
): boolean {
  return doTimeRangesOverlap(bookingStart, bookingEnd, slotStart, slotEnd);
}

/**
 * Check if any booking in a list overlaps with a slot
 * @param bookings Array of bookings with startTime and endTime properties
 * @param slotStart Slot start time (HH:MM format)
 * @param slotEnd Slot end time (HH:MM format)
 * @param excludeExpired Whether to exclude expired temporary/on_hold bookings
 * @returns true if any booking overlaps with the slot, false otherwise
 */
export function doesAnyBookingOverlapWithSlot(
  bookings: Array<{
    startTime: string;
    endTime: string;
    status?: string;
    createdAt?: Date | string;
  }>,
  slotStart: string,
  slotEnd: string,
  excludeExpired: boolean = true
): boolean {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  return bookings.some(booking => {
    // Exclude expired temporary and on_hold bookings if requested
    if (excludeExpired && (booking.status === 'temp' || booking.status === 'on_hold')) {
      const bookingCreatedAt = new Date(booking.createdAt || 0);
      if (bookingCreatedAt < tenMinutesAgo) {
        return false;
      }
    }

    return doesBookingOverlapWithSlot(
      booking.startTime,
      booking.endTime,
      slotStart,
      slotEnd
    );
  });
} 