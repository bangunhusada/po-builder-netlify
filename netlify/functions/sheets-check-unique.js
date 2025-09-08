const { getSheets } = require("./_sheetsClient");

exports.handler = async (event) => {
  try {
    const num = event.queryStringParameters?.num || "";
    if (!num) return { statusCode: 400, body: "Missing num" };

    const SHEET_ID = process.env.SHEET_ID;
    const SHEET_TAB = process.env.SHEET_TAB || "Sheet1";
    if (!SHEET_ID) throw new Error("Missing env: SHEET_ID");

    const sheets = getSheets();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!B:B`,
    });
    const values = (data.values || []).flat().map(String);
    const duplicate = values.includes(String(num));

    return { statusCode: 200, body: JSON.stringify({ duplicate }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
