"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  bookingDetails: {
    id: string;
    date: string;
    time: string;
    duration: number;
    totalAmount: number;
    engineerName?: string;
  };
}

export function StripePaymentForm({ clientSecret, bookingDetails }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormContent bookingDetails={bookingDetails} />
    </Elements>
  );
}

function PaymentFormContent({ bookingDetails }: { bookingDetails: PaymentFormProps["bookingDetails"] }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/sessions`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred with your payment.");
        return;
      }

      if (paymentIntent.status === "succeeded") {
        router.push("/dashboard/sessions");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">Booking Summary</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Date</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(bookingDetails.date).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Time</dt>
              <dd className="text-sm font-medium text-gray-900">{bookingDetails.time}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Duration</dt>
              <dd className="text-sm font-medium text-gray-900">{bookingDetails.duration} hours</dd>
            </div>
            {bookingDetails.engineerName && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Engineer</dt>
                <dd className="text-sm font-medium text-gray-900">{bookingDetails.engineerName}</dd>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t">
              <dt className="text-base font-medium text-gray-900">Total</dt>
              <dd className="text-base font-medium text-gray-900">
                ${bookingDetails.totalAmount.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <PaymentElement />

          {errorMessage && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              `Pay $${bookingDetails.totalAmount.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </form>
  );
} 