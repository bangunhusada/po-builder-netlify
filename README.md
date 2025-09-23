# PO Builder (Vite + Netlify Functions)

## Langkah cepat
1) Upload semua file/folder ini ke GitHub.
2) Di Netlify, set **Environment variables**:
   - `SHEET_ID` = ID Google Sheet
   - `API_KEY` = Google API key
   - (opsional) `SHEET_TAB` = nama tab, default `Sheet1`
3) Deploy. Build command: `npm run build`, Publish directory: `dist`.
4) Tombol "Simpan ke Google Sheets" akan memanggil fungsi:
   - `/.netlify/functions/sheets-append`
   - `/.netlify/functions/sheets-history`
   - `/.netlify/functions/sheets-check-unique`

> Tailwind dipakai via **CDN** di `index.html` supaya tidak perlu deps tambahan.