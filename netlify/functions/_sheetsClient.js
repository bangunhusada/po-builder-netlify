// netlify/functions/_sheetsClient.js
import { google } from "googleapis";

export function getSheets() {
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const privateKey = (process.env.GCP_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GCP_CLIENT_EMAIL or GCP_PRIVATE_KEY env");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}
