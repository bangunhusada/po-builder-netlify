const { getSheets } = require("./_sheetsClient");

/** Ambil kode jenis dari payload.poType */
function typeCode(poType = "") {
  const s = String(poType || "").toLowerCase();
  if (s.startsWith("pre")) return "PRE";
  if (s.startsWith("obat")) return "OOT";
  return "REG";
}

/** Parse "001/SP/PRE/09/2025" -> {seq:1, code:'PRE', mm:'09', yyyy:'2025'} */
function parseNomorSP(n = "") {
  const m = String(n).trim().match(/^(\d{3})\/SP\/([A-Z]{3})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return { seq: parseInt(m[1], 10), code: m[2], mm: m[3], yyyy: m[4] };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { payload } = JSON.parse(event.body || "{}");
    if (!payload) {
      return { statusCode: 400, body: JSON.stringify({ error: { message: "missing payload" } }) };
    }

    const nomorSPInput = (payload?.header?.nomorSP || "").trim();
    if (!nomorSPInput) {
      return { statusCode: 400, body: JSON.stringify({ error: { message: "missing nomorSP" } }) };
    }

    const sheets = await getSheets();
    const tab = process.env.SHEET_TAB || "PO_LOG";

    // Ambil semua nomorSP yang sudah tercatat (kolom B)
    const rowsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `${tab}!B2:B`,
    });
    const existing = (rowsRes.data.values || []).map((r) => (r[0] || "").trim());

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    const code = typeCode(payload.poType);

    // Cek apakah nomor input sudah dipakai
    const already = existing.includes(nomorSPInput);

    let nomorToUse = nomorSPInput;
    let bumped = false;

    if (already) {
      // Cari sequence tertinggi untuk bulan/tahun & jenis yang sama, lalu ++
      let maxSeq = 0;
      for (const n of existing) {
        const p = parseNomorSP(n);
        if (p && p.code === code && p.mm === mm && p.yyyy === yyyy) {
          if (p.seq > maxSeq) maxSeq = p.seq;
        }
      }
      const nextSeq = maxSeq + 1;
      const seqStr = String(nextSeq).padStart(3, "0");
      nomorToUse = `${seqStr}/SP/${code}/${mm}/${yyyy}`;
      bumped = true;
    }

    // Susun data baris untuk append
    const tanggal = now.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const jenis = payload.poType || "";
    const ringkasan =
      (payload.items || [])
        .map((it) => it?.nama)
        .filter(Boolean)
        .slice(0, 2)
        .join(", ") || "";
    const json = JSON.stringify(payload);

    // Append ke sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `${tab}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[tanggal, nomorToUse, jenis, ringkasan, json]],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, nomorSPUsed: nomorToUse, bumped }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: e.message || String(e) } }),
    };
  }
};
