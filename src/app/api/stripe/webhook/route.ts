import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { sendEmail } from "@/lib/email/sendEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

      // Update booking status
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);
      const bookingData = bookingDoc.data();

      await updateDoc(bookingRef, {
        status: "confirmed",
        paidAt: new Date().toISOString(),
        stripePaymentIntentId: paymentIntent.id,
      });

      // Get engineer details
      const engineerDoc = await getDoc(
        doc(db, "engineers", paymentIntent.metadata.engineerId)
      );
      const engineerData = engineerDoc.data();

      // Send confirmation emails
      await Promise.all([
        // Send to client
        sendEmail({
          to: bookingData?.clientEmail,
          subject: "Booking Confirmation - CTRL Room Studios",
          template: "booking-confirmation",
          data: {
            bookingId,
            date: bookingData?.date,
            time: bookingData?.startTime,
            duration: bookingData?.duration,
            engineer: engineerData?.name,
            amount: paymentIntent.amount / 100,
          },
        }),
        // Send to engineer
        sendEmail({
          to: engineerData?.email,
          subject: "New Booking Notification - CTRL Room Studios",
          template: "booking-notification-engineer",
          data: {
            bookingId,
            date: bookingData?.date,
            time: bookingData?.startTime,
            duration: bookingData?.duration,
            client: bookingData?.clientEmail,
          },
        }),
      ]);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 