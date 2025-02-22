import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailData {
  bookingId: string;
  date: string;
  time: string;
  duration: number;
  engineer?: string;
  client?: string;
  amount?: number;
}

interface SendEmailProps {
  to: string;
  subject: string;
  template: 'booking-confirmation' | 'booking-notification-engineer';
  data: EmailData;
}

export async function sendEmail({ to, subject, template, data }: SendEmailProps) {
  try {
    let html = '';

    switch (template) {
      case 'booking-confirmation':
        html = `
          <h1>Booking Confirmation</h1>
          <p>Thank you for booking with CTRL Room Studios!</p>
          <p>Here are your booking details:</p>
          <ul>
            <li>Booking ID: ${data.bookingId}</li>
            <li>Date: ${data.date}</li>
            <li>Time: ${data.time}</li>
            <li>Duration: ${data.duration} hours</li>
            <li>Engineer: ${data.engineer}</li>
            <li>Amount Paid: $${data.amount?.toFixed(2)}</li>
          </ul>
          <p>We look forward to seeing you!</p>
        `;
        break;

      case 'booking-notification-engineer':
        html = `
          <h1>New Booking Notification</h1>
          <p>You have a new booking at CTRL Room Studios:</p>
          <ul>
            <li>Booking ID: ${data.bookingId}</li>
            <li>Date: ${data.date}</li>
            <li>Time: ${data.time}</li>
            <li>Duration: ${data.duration} hours</li>
            <li>Client: ${data.client}</li>
          </ul>
          <p>Please ensure you're available at the scheduled time.</p>
        `;
        break;
    }

    const result = await resend.emails.send({
      from: 'CTRL Room Studios <bookings@ctrlroom.studio>',
      to: [to],
      subject,
      html,
    });

    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
} 