const { google } = require("googleapis");

function getAuth() {
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  let privateKey = process.env.GCP_PRIVATE_KEY || "";
  privateKey = privateKey.replace(/\\n/g, "\n"); // handle \n saat disimpan di env

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

module.exports = { getSheets };
