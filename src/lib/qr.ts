import QRCode from "qrcode";

// Encodes just the ticket code, not a URL — an organizer scanning at the
// door looks it up the same way the admin participants search box already
// does (by ticket code), no extra decoding logic needed on either end.
export async function ticketQrDataUrl(ticketCode: string): Promise<string> {
  return QRCode.toDataURL(ticketCode, {
    width: 220,
    margin: 1,
    color: { dark: "#0e2819", light: "#ffffff" },
  });
}
