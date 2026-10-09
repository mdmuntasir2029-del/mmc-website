// Builds the one-page "Participant Details" PDF attached to the
// registration email — printable (or showable on a phone) at check-in.
// Ported from a Node prototype verified against real multi-line/overflow
// cases before being adapted here; pdf-lib/qrcode's API is identical
// between the two npm-compatible runtimes.

import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import QRCode from "npm:qrcode@1.5.4";

const GREEN_DARK = rgb(0.055, 0.157, 0.098);
const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.4, 0.4, 0.4);
const WHITE = rgb(1, 1, 1);
const PANEL_BG = rgb(0.97, 0.99, 0.97);

export interface TicketPdfData {
  fullName: string;
  ticketCode: string;
  eventName: string;
  eventDate: string;
  venue: string | null;
  school: string | null;
  className: string | null;
  status: string;
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildTicketPdf(data: TicketPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const rawFields: { label: string; value: string; emphasize?: boolean }[] = [
    { label: "Full Name", value: data.fullName },
    { label: "Ticket Code", value: data.ticketCode, emphasize: true },
    { label: "Event", value: data.eventName },
    { label: "Date & Time", value: data.eventDate },
  ];
  if (data.venue) rawFields.push({ label: "Venue", value: data.venue });
  if (data.school) rawFields.push({ label: "School", value: data.school });
  if (data.className) rawFields.push({ label: "Class", value: data.className });
  rawFields.push({ label: "Status", value: data.status.toUpperCase(), emphasize: true });

  const panelX = 56;
  const panelW = 500;
  const headerH = 44;
  const topPad = 26;
  const bottomPad = 20;
  const labelToValueGap = 14;
  const rowGapAfter = 12;
  const qrSize = 120;
  const textWidth = panelW - 40 - qrSize - 24;

  const fields = rawFields.map((f) => {
    const size = f.emphasize ? 15 : 12;
    const valueFont = f.emphasize ? bold : font;
    return { ...f, size, lines: wrapText(f.value, valueFont, size, textWidth) };
  });

  const lineHeight = 15;
  let fieldsHeight = 0;
  for (const f of fields) {
    fieldsHeight += labelToValueGap + f.lines.length * lineHeight + rowGapAfter;
  }

  const panelH = headerH + topPad + fieldsHeight + bottomPad;
  const panelTop = 760;
  const panelY = panelTop - panelH;

  page.drawRectangle({
    x: panelX, y: panelY, width: panelW, height: panelH,
    color: PANEL_BG,
    borderColor: GREEN_DARK,
    borderWidth: 1.5,
  });
  page.drawRectangle({
    x: panelX, y: panelY + panelH - headerH, width: panelW, height: headerH,
    color: GREEN_DARK,
  });
  page.drawText("MANARAT MATHLETES CLUB", {
    x: panelX + 20, y: panelY + panelH - 26, size: 13, font: bold, color: WHITE,
  });
  page.drawText("PARTICIPANT DETAILS", {
    x: panelX + 20, y: panelY + panelH - 40, size: 8, font, color: rgb(0.8, 0.9, 0.85),
  });

  const qrDataUrl: string = await QRCode.toDataURL(data.ticketCode, { width: 300, margin: 1 });
  const qrPngBytes = Uint8Array.from(atob(qrDataUrl.split(",")[1]), (c) => c.charCodeAt(0));
  const qrImage = await doc.embedPng(qrPngBytes);
  page.drawImage(qrImage, {
    x: panelX + panelW - qrSize - 24,
    y: panelY + panelH - headerH - qrSize - 16,
    width: qrSize,
    height: qrSize,
  });

  const textX = panelX + 20;
  let y = panelY + panelH - headerH - topPad;
  for (const f of fields) {
    page.drawText(f.label.toUpperCase(), { x: textX, y, size: 8, font, color: MUTED });
    y -= labelToValueGap;
    for (const line of f.lines) {
      page.drawText(line, {
        x: textX, y,
        size: f.size,
        font: f.emphasize ? bold : font,
        color: INK,
      });
      y -= lineHeight;
    }
    y -= rowGapAfter;
  }

  page.drawText("Present this panel (printed or on your phone) at check-in on the day of the event.", {
    x: panelX, y: panelY - 20, size: 9, font, color: MUTED,
  });

  return doc.save();
}
