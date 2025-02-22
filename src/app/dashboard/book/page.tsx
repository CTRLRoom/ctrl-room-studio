"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  createBooking,
  checkAvailability,
  getEngineerAvailability,
} from "@/lib/firebase/bookingUtils";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

interface Engineer {
  id: string;
  name: string;
  specialties: string[];
  workingHours: {
    start: string;
    end: string;
  };
  hourlyRate: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

export default function BookingPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [duration, setDuration] = useState(2); // Minimum 2 hours
  const [loading, setLoading] = useState(false);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch engineers from Firestore
    const fetchEngineers = async () => {
      try {
        const engineersSnapshot = await getDocs(collection(db, "engineers"));
        const engineersList: Engineer[] = [];
        engineersSnapshot.forEach((doc) => {
          engineersList.push({ id: doc.id, ...doc.data() } as Engineer);
        });
        setEngineers(engineersList);
      } catch (error) {
        console.error("Error fetching engineers:", error);
        setError("Failed to load engineers. Please try again later.");
      }
    };

    fetchEngineers();
  }, []);

  useEffect(() => {
    // Fetch available time slots when date and engineer are selected
    const fetchAvailability = async () => {
      if (!selectedDate || !selectedEngineer) return;

      try {
        const slots = await getEngineerAvailability(selectedEngineer, selectedDate);
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error fetching availability:", error);
        setError("Failed to load available time slots. Please try again.");
      }
    };

    fetchAvailability();
  }, [selectedDate, selectedEngineer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check if the slot is still available
      const isAvailable = await checkAvailability(
        selectedDate,
        selectedTime,
        duration,
        selectedEngineer
      );

      if (!isAvailable) {
        setError(
          "This time slot is no longer available. Please select another time."
        );
        return;
      }

      // Calculate total amount
      const engineer = engineers.find((eng) => eng.id === selectedEngineer);
      const studioRate = 75; // This should come from studio settings
      const engineerRate = engineer?.hourlyRate || 50;
      const totalAmount = (studioRate + engineerRate) * duration;

      // Create the booking
      const booking = await createBooking({
        date: selectedDate,
        startTime: selectedTime,
        duration,
        engineerId: selectedEngineer,
        clientId: user.uid,
        status: "pending",
        totalAmount,
      });

      // Redirect to payment page
      window.location.href = `/payment?bookingId=${booking.id}`;
    } catch (error) {
      console.error("Booking failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="py-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold text-gray-900">
            Book a Recording Session
          </h1>
          <p className="mt-2 text-gray-600">
            Choose your preferred date, time, and engineer. Minimum booking is 2
            hours.
          </p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(""); // Reset time when date changes
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="engineer"
                  className="block text-sm font-medium text-gray-700"
                >
                  Engineer
                </label>
                <select
                  id="engineer"
                  name="engineer"
                  required
                  value={selectedEngineer}
                  onChange={(e) => {
                    setSelectedEngineer(e.target.value);
                    setSelectedTime(""); // Reset time when engineer changes
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select an engineer</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name} - ${eng.hourlyRate}/hour
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Time
                </label>
                <select
                  id="time"
                  name="time"
                  required
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate || !selectedEngineer}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                >
                  <option value="">Select a time</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.start} value={slot.start}>
                      {slot.start}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700"
                >
                  Duration (hours)
                </label>
                <select
                  id="duration"
                  name="duration"
                  required
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {[2, 3, 4, 6, 8].map((hours) => (
                    <option key={hours} value={hours}>
                      {hours} hours
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-medium text-gray-900">
                Booking Summary
              </h2>
              <dl className="mt-4 space-y-2">
                {selectedEngineer && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Studio Rate</dt>
                      <dd className="text-gray-900">${75 * duration}.00</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Engineer Fee</dt>
                      <dd className="text-gray-900">
                        $
                        {(engineers.find((eng) => eng.id === selectedEngineer)
                          ?.hourlyRate || 50) * duration}
                        .00
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <dt className="text-lg font-medium text-gray-900">Total</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        $
                        {(75 +
                          (engineers.find((eng) => eng.id === selectedEngineer)
                            ?.hourlyRate || 50)) *
                          duration}
                        .00
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !selectedTime}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Book Session"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 