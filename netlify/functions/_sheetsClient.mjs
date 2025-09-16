// netlify/functions/_sheetsClient.mjs
import { google } from "googleapis";

export async function getSheets() {
  const client_email = process.env.GCP_CLIENT_EMAIL;
  const private_key = (process.env.GCP_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!client_email || !private_key) throw new Error("Missing GCP credentials");

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}
