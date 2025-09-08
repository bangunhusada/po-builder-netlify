const { getSheets } = require("./_sheetsClient");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { payload } = JSON.parse(event.body || "{}");
    if (!payload) return { statusCode: 400, body: "Missing payload" };

    const SHEET_ID = process.env.SHEET_ID;
    const SHEET_TAB = process.env.SHEET_TAB || "Sheet1";
    const sheets = getSheets();

    const {
      poType,
      header = {},
      pemesan = {},
      kebutuhan = {},
      items = [],
      tanggalTempat = {},
    } = payload;

    const tanggal = tanggalTempat.tanggal || new Date().toLocaleDateString("id-ID");
    const nomorSP = header.nomorSP || "";
    const namaKlinik = kebutuhan.namaKlinik || header.namaFaskes || "";
    const ringkasanObat = items
      .map(it => (it.nama || "") + (it.zatAktif ? ` (${it.zatAktif})` : "") + (it.jumlah ? ` x${it.jumlah}` : ""))
      .join("; ");

    const row = [
      tanggal,                // A
      nomorSP,                // B
      namaKlinik,             // C
      pemesan.nama || "",     // D
      poType || "",           // E
      ringkasanObat,          // F
      JSON.stringify(payload) // G
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
