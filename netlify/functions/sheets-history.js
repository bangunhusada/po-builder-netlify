// netlify/functions/sheets-history.js
import { getSheets } from "./_sheetsClient.mjs"; // <- pakai .mjs sesuai repo kamu

export default async function handler(req, res) {
  try {
    const sheets = await getSheets();
    const sheetId = process.env.SHEET_ID;
    const tab = process.env.SHEET_TAB || "rekap"; // pastikan sesuai
    if (!sheetId) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: "SHEET_ID env tidak di-set" }));
    }

    // Ambil A:E (tanggal, nomorSP, jenis, ringkasan, json)
    const range = `'${tab}'!A:E`;
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    // Aman terhadap sheet kosong / tab salah
    const rows = (resp && resp.data && Array.isArray(resp.data.values))
      ? resp.data.values
      : [];

    // Tidak ada data?
    if (rows.length <= 1) {
      // Tetap balas sukses dengan rows: []
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ rows: [] }));
    }

    // Baris pertama header
    const body = rows.slice(1).map((r, idx) => ({
      idx,
      tanggal: r[0] || "",
      nomorSP: r[1] || "",
      jenis: r[2] || "",
      ringkasan: r[3] || "",
      json: r[4] || "",
    }));

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ rows: body }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: e?.message || String(e) }));
  }
}
