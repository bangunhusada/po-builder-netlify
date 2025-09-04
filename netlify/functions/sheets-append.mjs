const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.API_KEY;
const SHEET_TAB = process.env.SHEET_TAB || "Sheet1";

function badEnv() {
  const miss = [];
  if (!SHEET_ID) miss.push("SHEET_ID");
  if (!API_KEY) miss.push("API_KEY");
  return miss;
}

function jsonRes(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(bodyObj)
  };
}
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonRes(405, { error: "Method Not Allowed" });
  }
  const miss = badEnv();
  if (miss.length) {
    return jsonRes(500, { error: "Missing env: " + miss.join(", ") });
  }
  try {
    const { payload } = JSON.parse(event.body || "{}");
    if (!payload) return jsonRes(400, { error: "Missing payload" });

    const items = Array.isArray(payload.items) ? payload.items : [];
    const ringkasanObat = items
      .map(it => (it?.nama || "") + (it?.zatAktif ? ` (${it.zatAktif})` : "") + (it?.jumlah ? ` x${it.jumlah}` : ""))
      .join("; ");

    const range = `${SHEET_TAB}!A1`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&key=${encodeURIComponent(API_KEY)}`;
    const values = [[
      payload?.tanggalTempat?.tanggal || "",
      payload?.header?.nomorSP || "",
      payload?.kebutuhan?.namaKlinik || "",
      payload?.pemesan?.nama || "",
      payload?.poType || "",
      ringkasanObat,
      JSON.stringify(payload)
    ]];
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values })
    });
    const data = await res.json();
    if (!res.ok || data?.error) {
      return jsonRes(res.status || 500, { error: data?.error?.message || "Sheets append failed", raw: data });
    }
    return jsonRes(200, { ok: true });
  } catch (e) {
    return jsonRes(500, { error: String(e?.message || e) });
  }
};