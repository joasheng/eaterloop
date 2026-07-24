import { Resend } from "resend";

function masked(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  return `${local.slice(0, 2)}•••@${domain}`;
}

export async function sendNotificationEmail({
  to,
  subject,
  text,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
}) {
  const mode = process.env.EMAIL_MODE ?? "log";
  if (mode !== "send") {
    console.info(`[email:log] to=${masked(to)} subject=${subject}\n${text}`);
    return { id: `log_${Date.now()}` };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Resend notification credentials are incomplete.");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send(
    { from, to, subject, text, html },
    { idempotencyKey },
  );
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Resend did not return a message ID.");
  return { id: data.id };
}
