"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useSearchParams, useRouter } from "next/navigation";
import { StripePaymentForm } from "@/components/StripePaymentForm";

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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const bookingData = bookingDoc.data() as Omit<BookingDetails, "id">;
        
        // Fetch engineer details
        const engineerDoc = await getDoc(doc(db, "engineers", bookingData.engineerId));
        const engineerData = engineerDoc.data();

        const bookingDetails = {
          ...bookingData,
          id: bookingDoc.id,
          engineerName: engineerData?.name || "Unknown Engineer",
        };

        setBooking(bookingDetails);

        // Create payment intent
        const response = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId: bookingDoc.id }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load booking details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Complete Your Booking
            </h1>
            <p className="mt-2 text-gray-600">
              Please review your booking details and complete the payment
            </p>
          </div>

          {clientSecret ? (
            <StripePaymentForm
              clientSecret={clientSecret}
              bookingDetails={{
                id: booking.id,
                date: booking.date,
                time: booking.startTime,
                duration: booking.duration,
                totalAmount: booking.totalAmount,
                engineerName: booking.engineerName,
              }}
            />
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">
                Preparing payment form...
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 