// netlify/functions/drive-upload.js
const { google } = require("googleapis");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const { filename, pdfBase64 } = JSON.parse(event.body || "{}");
    if (!filename || !pdfBase64) {
      return { statusCode: 400, body: "Missing filename or pdfBase64" };
    }

    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = (process.env.GCP_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    const folderId   = process.env.DRIVE_FOLDER_ID; // <- set di Site Env

    if (!clientEmail || !privateKey || !folderId) {
      return { statusCode: 500, body: "Missing env: GCP_CLIENT_EMAIL/GCP_PRIVATE_KEY/DRIVE_FOLDER_ID" };
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    const media = {
      mimeType: "application/pdf",
      body: Buffer.from(pdfBase64, "base64"),
    };

    const fileMetadata = {
      name: filename,
      parents: [folderId],
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink, webContentLink",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, file: res.data }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
