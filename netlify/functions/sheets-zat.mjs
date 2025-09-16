// netlify/functions/sheets-zat.mjs
import { getSheets } from "./_sheetsClient.mjs";

/**
 * ENV yang dipakai:
 * - SHEET_ID         : ID spreadsheet (sudah ada di project)
 * - ZAT_PRE_TAB      : (opsional) nama tab untuk Prekursor. Default: "Prekursor"
 * - ZAT_OOT_TAB      : (opsional) nama tab untuk OOT.        Default: "OOT"
 * - API_KEY          : (opsional) jika ingin diamankan via header x-api-key
 */

function json(res, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
  });
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return json(null, 200, { ok: true });
    }

    // (Opsional) Kunci sederhana
    const needKey = !!process.env.API_KEY;
    const reqKey = event.headers["x-api-key"] || event.headers["X-Api-Key"];
    if (needKey && reqKey !== process.env.API_KEY) {
      return json(null, 401, { error: "Unauthorized" });
    }

    const SHEET_ID = process.env.SHEET_ID;
    if (!SHEET_ID) return json(null, 500, { error: "Missing SHEET_ID" });

    const TAB_PRE = process.env.ZAT_PRE_TAB || "Prekursor";
    const TAB_OOT = process.env.ZAT_OOT_TAB || "OOT";

    const sheets = await getSheets();

    if (event.httpMethod === "GET") {
      // Ambil kolom A (nama zat) dari kedua tab
      const ranges = [`${TAB_PRE}!A:A`, `${TAB_OOT}!A:A`];
      const resp = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SHEET_ID,
        ranges,
        majorDimension: "ROWS",
      });

      const valuesPre = (resp.data.valueRanges?.[0]?.values || [])
        .map((row) => String(row?.[0] || "").trim())
        .filter(Boolean);

      const valuesOOT = (resp.data.valueRanges?.[1]?.values || [])
        .map((row) => String(row?.[0] || "").trim())
        .filter(Boolean);

      // Buang header kalau ada (mis. "Nama" di baris 1)
      const pre = valuesPre.slice(0, 1)[0]?.toLowerCase() === "nama" ? valuesPre.slice(1) : valuesPre;
      const oot = valuesOOT.slice(0, 1)[0]?.toLowerCase() === "nama" ? valuesOOT.slice(1) : valuesOOT;

      return json(null, 200, { pre, oot });
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const pre = Array.isArray(body.pre) ? body.pre : [];
      const oot = Array.isArray(body.oot) ? body.oot : [];

      // rapikan + dedup
      function dedup(list) {
        const seen = new Set();
        const out = [];
        for (const it of list) {
          const v = String(it || "").trim();
          if (!v) continue;
          const key = v.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            out.push(v);
          }
        }
        return out;
      }
      const preClean = dedup(pre);
      const ootClean = dedup(oot);

      // Hapus isi tab & tulis ulang (header + isi)
      // 1) clear
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: `${TAB_PRE}!A:Z`,
      });
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: `${TAB_OOT}!A:Z`,
      });

      // 2) tulis (baris 1 = header "Nama")
      const makeBody = (arr) => ({
        range: "A1",
        majorDimension: "ROWS",
        values: [["Nama"], ...arr.map((x) => [x])],
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_PRE}!A1`,
        valueInputOption: "RAW",
        requestBody: makeBody(preClean),
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_OOT}!A1`,
        valueInputOption: "RAW",
        requestBody: makeBody(ootClean),
      });

      return json(null, 200, { ok: true, counts: { pre: preClean.length, oot: ootClean.length } });
    }

    return json(null, 405, { error: "Method not allowed" });
  } catch (e) {
    return json(null, 500, { error: e?.message || String(e) });
  }
}
