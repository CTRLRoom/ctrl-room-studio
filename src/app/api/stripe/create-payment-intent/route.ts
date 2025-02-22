import { NextResponse } from "next/server";
import Stripe from "stripe";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    // Get booking details from Firestore
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
    if (!bookingDoc.exists()) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data();

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: bookingData.totalAmount * 100, // Convert to cents
      currency: "usd",
      metadata: {
        bookingId,
        engineerId: bookingData.engineerId,
        clientId: bookingData.clientId,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
} 