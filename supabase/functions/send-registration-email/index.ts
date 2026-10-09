// Fest Hub: sends a registration confirmation/waitlist email via Brevo's
// transactional email API, with a one-page "Participant Details" PDF
// (name, ticket code, QR code, event/venue/time, school/class, status)
// attached for use at check-in — see ticket-pdf.ts. Deploy with:
//   supabase functions deploy send-registration-email --project-ref <ref>
//   supabase secrets set BREVO_API_KEY=... SENDER_EMAIL=... SENDER_NAME="Manarat Mathletes Club" --project-ref <ref>
// Called fire-and-forget from the frontend right after a successful
// registerForEvent() — see src/pages/EventPage.tsx. A failed email never
// blocks or rolls back the registration itself; this is a convenience,
// not part of the core flow's correctness.
//
// Needs its own service_role key (set automatically as SUPABASE_SERVICE_ROLE_KEY
// by the Supabase platform for every Edge Function — not something you set
// yourself) to read the event's name/date, since event_registrations has
// no public read policy.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildTicketPdf } from "./ticket-pdf.ts";

interface RequestBody {
  registrationId: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("SENDER_EMAIL");
  const senderName = Deno.env.get("SENDER_NAME") ?? "Manarat Mathletes Club";
  if (!brevoApiKey || !senderEmail) {
    // Not configured yet — fail quietly rather than 500, so a deployment
    // that hasn't had its secrets set doesn't surface as a visible error
    // to the registrant (the frontend ignores this call's result anyway).
    return new Response(JSON.stringify({ skipped: "email not configured" }), { status: 200 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!body.registrationId) {
    return new Response("registrationId is required", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: registration, error: regError } = await supabase
    .from("event_registrations")
    .select("full_name, email, ticket_code, status, event_id, school, class_name")
    .eq("id", body.registrationId)
    .single();
  if (regError || !registration) {
    return new Response(JSON.stringify({ error: "Registration not found" }), { status: 404 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("name, starts_at, venue, slug")
    .eq("id", registration.event_id)
    .single();
  if (eventError || !event) {
    return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
  }

  const isWaitlisted = registration.status === "waitlisted";
  const eventDate = new Date(event.starts_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = isWaitlisted
    ? `You're on the waitlist for ${event.name}`
    : `You're registered for ${event.name}`;

  const statusLine = isWaitlisted
    ? "You've been added to the waitlist — you'll be automatically confirmed if a spot opens up."
    : "Your registration is confirmed.";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>Hi ${registration.full_name},</p>
      <p>${statusLine}</p>
      <p>
        <strong>Event:</strong> ${event.name}<br/>
        <strong>Date &amp; time:</strong> ${eventDate}<br/>
        ${event.venue ? `<strong>Venue:</strong> ${event.venue}<br/>` : ""}
        <strong>Ticket code:</strong> ${registration.ticket_code}
      </p>
      <p>Keep this ticket code and this email address — you'll need both to look up or cancel your registration.</p>
      <p>Your participant details panel is attached as a PDF — bring it
      (printed or on your phone) on the day of the event for check-in.</p>
    </div>
  `;

  const pdfBytes = await buildTicketPdf({
    fullName: registration.full_name,
    ticketCode: registration.ticket_code,
    eventName: event.name,
    eventDate,
    venue: event.venue,
    school: registration.school,
    className: registration.class_name,
    status: registration.status,
  });

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: registration.email, name: registration.full_name }],
      subject,
      htmlContent: html,
      attachment: [
        {
          content: toBase64(pdfBytes),
          name: `${registration.ticket_code}-ticket.pdf`,
        },
      ],
    }),
  });

  if (!brevoRes.ok) {
    const errText = await brevoRes.text();
    return new Response(JSON.stringify({ error: "Brevo send failed", detail: errText }), { status: 502 });
  }

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
});
