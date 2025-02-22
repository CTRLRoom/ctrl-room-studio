import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

interface BookingData {
  date: string;
  startTime: string;
  duration: number;
  engineerId: string;
  clientId: string;
  status: "pending" | "confirmed" | "cancelled";
  totalAmount: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

export async function createBooking(
  bookingData: BookingData
): Promise<{ id: string }> {
  try {
    // Check if the time slot is available
    const isAvailable = await checkAvailability(
      bookingData.date,
      bookingData.startTime,
      bookingData.duration,
      bookingData.engineerId
    );

    if (!isAvailable) {
      throw new Error("Selected time slot is not available");
    }

    // Create the booking
    const bookingRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update engineer's schedule
    await updateEngineerSchedule(bookingRef.id, bookingData);

    return { id: bookingRef.id };
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingData["status"]
): Promise<void> {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
}

export async function checkAvailability(
  date: string,
  startTime: string,
  duration: number,
  engineerId: string
): Promise<boolean> {
  try {
    // Get all bookings for the engineer on the specified date
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("engineerId", "==", engineerId),
      where("date", "==", date),
      where("status", "!=", "cancelled")
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const existingBookings: TimeSlot[] = [];

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      existingBookings.push({
        start: booking.startTime,
        end: addHoursToTime(booking.startTime, booking.duration),
      });
    });

    const requestedSlot = {
      start: startTime,
      end: addHoursToTime(startTime, duration),
    };

    // Check for conflicts with existing bookings
    return !existingBookings.some(
      (booking) =>
        (requestedSlot.start >= booking.start &&
          requestedSlot.start < booking.end) ||
        (requestedSlot.end > booking.start && requestedSlot.end <= booking.end) ||
        (requestedSlot.start <= booking.start && requestedSlot.end >= booking.end)
    );
  } catch (error) {
    console.error("Error checking availability:", error);
    throw error;
  }
}

export async function getEngineerAvailability(
  engineerId: string,
  date: string
): Promise<TimeSlot[]> {
  try {
    // Get engineer's schedule
    const engineerDoc = await getDoc(doc(db, "engineers", engineerId));
    const engineerData = engineerDoc.data();

    if (!engineerData) {
      throw new Error("Engineer not found");
    }

    // Get all bookings for the engineer on the specified date
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("engineerId", "==", engineerId),
      where("date", "==", date),
      where("status", "!=", "cancelled")
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookedSlots: TimeSlot[] = [];

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      bookedSlots.push({
        start: booking.startTime,
        end: addHoursToTime(booking.startTime, booking.duration),
      });
    });

    // Calculate available time slots
    const availableSlots = calculateAvailableSlots(
      engineerData.workingHours,
      bookedSlots
    );

    return availableSlots;
  } catch (error) {
    console.error("Error getting engineer availability:", error);
    throw error;
  }
}

function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + hours * 60;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
    2,
    "0"
  )}`;
}

function calculateAvailableSlots(
  workingHours: { start: string; end: string },
  bookedSlots: TimeSlot[]
): TimeSlot[] {
  // Implementation would split the working hours into available slots
  // based on booked slots and minimum booking duration
  // This is a simplified version
  const availableSlots: TimeSlot[] = [];
  let currentTime = workingHours.start;

  while (currentTime < workingHours.end) {
    const endTime = addHoursToTime(currentTime, 2); // Minimum 2-hour slots
    const slot = { start: currentTime, end: endTime };

    const isSlotAvailable = !bookedSlots.some(
      (bookedSlot) =>
        (slot.start >= bookedSlot.start && slot.start < bookedSlot.end) ||
        (slot.end > bookedSlot.start && slot.end <= bookedSlot.end)
    );

    if (isSlotAvailable) {
      availableSlots.push(slot);
    }

    currentTime = endTime;
  }

  return availableSlots;
}

async function updateEngineerSchedule(
  bookingId: string,
  bookingData: BookingData
): Promise<void> {
  try {
    const scheduleRef = doc(
      db,
      "engineers",
      bookingData.engineerId,
      "schedule",
      bookingData.date
    );
    await updateDoc(scheduleRef, {
      bookings: [
        {
          id: bookingId,
          startTime: bookingData.startTime,
          duration: bookingData.duration,
        },
      ],
    });
  } catch (error) {
    console.error("Error updating engineer schedule:", error);
    throw error;
  }
} 