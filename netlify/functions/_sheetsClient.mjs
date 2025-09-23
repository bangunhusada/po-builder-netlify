// netlify/functions/_sheetsClient.mjs
import { google } from "googleapis";

export function getSheets() {
  const clientEmail = process.env.GCP_CLIENT_EMAIL || "";
  let privateKey = process.env.GCP_PRIVATE_KEY || "";
  privateKey = privateKey.replace(/\\n/g, "\n"); // handle \n

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GCP_CLIENT_EMAIL / GCP_PRIVATE_KEY");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}
