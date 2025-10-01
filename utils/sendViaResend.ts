import { Resend } from "resend";
import { buildInsiderEmail, RawInsiderRecord } from "./notification";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInsiderEmailResend(
  rawRecord: RawInsiderRecord,
  recipients: string[],
  from: string = "onboarding@resend.dev"
): Promise<void> {
  if (!recipients || recipients.length === 0) return;

  const { subject, text, html } = buildInsiderEmail(rawRecord);

  for (const recipient of recipients) {
    try {
      console.log("Sending email to:", recipient);

      await resend.emails.send({
        from,
        to: recipient,
        subject,
        text,
        html,
      });

      console.log("Sent to:", recipient);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to send to", recipient, error.message);
      } else {
        console.error("Failed to send to", recipient, error);
      }
    }
  }
}
