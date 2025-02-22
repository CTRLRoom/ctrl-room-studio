"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useSearchParams, useRouter } from "next/navigation";

interface BookingDetails {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  totalAmount: number;
  status: string;
  engineerId: string;
  engineerName?: string;
}

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError("No booking ID provided");
        setLoading(false);
        return;
      }

      try {
        const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
        if (!bookingDoc.exists()) {
          setError("Booking not found");
          setLoading(false);
          return;
        }

        const bookingData = bookingDoc.data() as BookingDetails;
        
        // Fetch engineer details
        const engineerDoc = await getDoc(doc(db, "engineers", bookingData.engineerId));
        const engineerData = engineerDoc.data();

        setBooking({
          ...bookingData,
          id: bookingDoc.id,
          engineerName: engineerData?.name || "Unknown Engineer",
        });
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!booking) return;
    setProcessing(true);
    setError(null);

    try {
      // Here you would:
      // 1. Create a payment intent with Stripe
      // 2. Process the payment
      // 3. Update the booking status
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "confirmed",
        paidAt: new Date().toISOString(),
      });

      // Redirect to success page
      router.push(`/dashboard/sessions`);
    } catch (error) {
      console.error("Payment failed:", error);
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error || "Booking not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Complete Your Booking
              </h1>

              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Booking Details
                </h2>
                <dl className="mt-4 space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Date</dt>
                    <dd className="text-gray-900">
                      {new Date(booking.date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Time</dt>
                    <dd className="text-gray-900">{booking.startTime}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Duration</dt>
                    <dd className="text-gray-900">{booking.duration} hours</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Engineer</dt>
                    <dd className="text-gray-900">{booking.engineerName}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-4">
                    <dt className="text-lg font-medium text-gray-900">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${booking.totalAmount}.00
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">
                  Payment Method
                </h2>
                <div className="mt-4">
                  {/* Here you would integrate Stripe Elements or another payment form */}
                  <div className="border rounded-md p-4 bg-gray-50">
                    <p className="text-gray-700">
                      Payment integration will be implemented here using Stripe.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {processing ? "Processing..." : `Pay $${booking.totalAmount}.00`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 