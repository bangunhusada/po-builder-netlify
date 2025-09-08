// netlify/functions/_sheetsClient.mjs
import { google } from "googleapis";

export async function getSheets() {
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  let privateKey = process.env.GCP_PRIVATE_KEY || "";

  if (!clientEmail || !privateKey) {
    throw new Error("Missing env: GCP_CLIENT_EMAIL or GCP_PRIVATE_KEY");
  }

  // Netlify menyimpan newline sebagai \n -> kembalikan ke newline asli
  privateKey = privateKey.replace(/\\n/g, "\n");

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  await jwt.authorize();
  return google.sheets({ version: "v4", auth: jwt });
}
