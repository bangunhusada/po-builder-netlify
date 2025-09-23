// netlify/functions/sheets-pbf.js
import { getSheets } from "./_sheetsClient.mjs";

function requireApiKey(event) {
  const must = process.env.API_KEY;        // opsional: kalau di-set, wajib cocok
  if (!must) return;
  const key = event.headers["x-api-key"] || (event.queryStringParameters || {}).key;
  if (key !== must) throw new Error("Unauthorized");
}

export const handler = async (event) => {
  try {
    requireApiKey(event);

    const sheets = await getSheets();
    const spreadsheetId = process.env.SHEET_ID;                  // sudah dipakai di fungsi kamu yang lain
    const tab = process.env.SHEET_TAB_PBF || "Master_PBF";       // tab default

    if (event.httpMethod === "GET") {
      // Baca A: nama, B: alamat, C: telp (mulai baris 2)
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tab}!A2:C`,
      });
      const rows = resp.data.values || [];
      const templates = rows
        .map((r) => ({
          nama: (r[0] || "").toString(),
          alamat: (r[1] || "").toString(),
          telp: (r[2] || "").toString(),
        }))
        .filter((t) => t.nama || t.alamat || t.telp);

      return {
        statusCode: 200,
        body: JSON.stringify({ templates }),
        headers: { "Content-Type": "application/json" },
      };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const list = Array.isArray(body.templates) ? body.templates : [];
      const rows = list.map((t) => [t.nama || "", t.alamat || "", t.telp || ""]);

      // Replace total isi tab: tulis header + data
      await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${tab}!A:Z` });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tab}!A1:C1`,
        valueInputOption: "RAW",
        requestBody: { values: [["nama", "alamat", "telp"]] },
      });
      if (rows.length) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${tab}!A2:C`,
          valueInputOption: "RAW",
          requestBody: { values: rows },
        });
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, count: rows.length }),
        headers: { "Content-Type": "application/json" },
      };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
