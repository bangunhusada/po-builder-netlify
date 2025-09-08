const { getSheets } = require("./_sheetsClient");

exports.handler = async () => {
  try {
    const SHEET_ID = process.env.SHEET_ID;
    const SHEET_TAB = process.env.SHEET_TAB || "Sheet1";
    const sheets = getSheets();

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:Z`,
    });

    const values = data.values || [];
    const rows = values.slice(1).map((r, idx) => ({
      idx,
      tanggal: r[0] || "",
      nomorSP: r[1] || "",
      namaKlinik: r[2] || "",
      pemesan: r[3] || "",
      jenis: r[4] || "",
      ringkasan: r[5] || "",
      json: r[6] || "",
    }));

    return { statusCode: 200, body: JSON.stringify({ rows }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
