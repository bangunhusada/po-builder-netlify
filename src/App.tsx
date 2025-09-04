import React, { useEffect, useMemo, useState } from "react";

/** ============== UI PRIMITIVES ============== */
function Card({ title, children }: any) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">i</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function Input({ label, value, onChange, className = "", type = "text", placeholder = "" }: any) {
  return (
    <label className={"block " + className}>
      <span className="text-xs text-gray-600">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
      />
    </label>
  );
}
function Select({ label, value, onChange, options, className = "" }: any) {
  const list = Array.isArray(options) ? options : [];
  return (
    <label className={"block " + className}>
      <span className="text-xs text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
      >
        {list.map((opt: any, i: number) => {
          const isObj = typeof opt === "object" && opt !== null;
          const val = isObj ? String(opt.value) : String(opt);
          const lab = isObj ? String(opt.label) : String(opt);
          return (
            <option key={i} value={val}>
              {lab}
            </option>
          );
        })}
      </select>
    </label>
  );
}

/** ============== APP (DEFAULT EXPORT) ============== */
export default function App() {
  /** ==== PRINT CSS (PO SAJA, 1 HALAMAN) ==== */
  const PrintCSS = (
    <style>{`
      /* A4 */
      @page { size: A4 portrait; margin: 10mm; }

      @media print {
        html, body {
          background: #fff !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .bg-gray-50 { background: #fff !important; }

        /* Saat <html> diberi class printing-po, SEMUA elemen selain .po-keep & turunannya disembunyikan.
           Kita akan menandai #po-print + leluhurnya sebagai .po-keep di printDoc(). */
        html.printing-po body *:not(.po-keep):not(.po-keep *) {
          display: none !important;
        }

        /* Area PO pas dengan margin A4 (10mm kiri-kanan) */
        #po-print {
          width: 186mm !important;     /* 210 - 2*10 */
          margin: 0 auto !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          padding: 0 !important;
          page-break-before: auto !important;
          page-break-after: avoid !important;
        }
        /* Ganti padding container (tailwind p-6) saat print */
        #po-print .p-6 { padding: 8mm !important; }

        /* Font & tabel dipadatkan */
        #po-print { font-size: 11px !important; }
        #po-print h2 { font-size: 16px !important; }
        #po-print .text-xl { font-size: 16px !important; }
        #po-print .text-2xl { font-size: 18px !important; }

        #po-print table { table-layout: fixed; width: 100%; border-collapse: collapse; }
        #po-print th, #po-print td { padding: 3px 6px !important; }
        #po-print table, #po-print thead, #po-print tbody, #po-print tr, #po-print th, #po-print td, #po-print img {
          break-inside: avoid; page-break-inside: avoid;
        }
      }
    `}</style>
  );

  // === Aktifkan tombol Sheets (opsional, tetap aman meski tidak dipakai) ===
  const hasSheets = true;

  // === State utama ===
  const [poType, setPoType] = useState("Prekursor");
  const [spAuto, setSpAuto] = useState(true);
  const [showMeta, setShowMeta] = useState(false);

  const [header, setHeader] = useState({
    namaFaskes: "KLINIK BANGUN HUSADA",
    izin: "Izin Klinik : 503 / 4736 / 83 / DKS / 2021",
    alamat: "Jl. Perumnas 207 Gorongan, Condongcatur, Depok, Sleman",
    telp: "Telp : (0274) 488314",
    judul: "SURAT PESANAN",
    nomorSP: "",
    logoUrl: "https://iili.io/KBiv0xa.png"
  });

  const [pemesan, setPemesan] = useState({
    nama: "apt. Bayu Bakti Angga S, M. Pharm. Sci.",
    jabatan: "Apoteker Penanggung Jawab",
    sipa: "503/11388-23042025-KES/11388-23042025-20250430/SIPA/2025",
  });

  const [pbf, setPbf] = useState({ nama: "", alamat: "", telp: "" });

  const [kebutuhan, setKebutuhan] = useState({
    namaKlinik: "Klinik Bangun Husada",
    alamat: "Jl. Perumnas 207 Gorongan, Condongcatur, Depok, Sleman",
    noIzin: "503/4736/83/DKS/2021",
  });

  const [tanggalTempat, setTanggalTempat] = useState({
    tempat: "Sleman",
    tanggal: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
  });

  const [items, setItems] = useState<any[]>([
    { nama: "", zatAktif: "", bentukKekuatan: "", satuan: "", jumlah: "", ket: "" },
  ]);

  // === Nomor SP Otomatis ===
  function typeCode(t: string) {
    const s = String(t || "").toLowerCase();
    if (s.indexOf("pre") === 0) return "PRE";
    if (s.indexOf("obat") === 0) return "OOT";
    return "REG";
  }
  function typeUpper(t: string) {
    const s = String(t || "").toLowerCase();
    if (s.indexOf("pre") === 0) return "PREKURSOR";
    if (s.indexOf("obat") === 0) return "OBAT-OBAT TERTENTU";
    return "REGULER";
  }
  function makeSpNumber(seq: number, d?: Date) {
    const dd = d || new Date();
    const mm = String(dd.getMonth() + 1).padStart(2, "0");
    const yyyy = dd.getFullYear();
    const nnn = String(seq || 1).padStart(3, "0");
    return nnn + "/SP/" + typeCode(poType) + "/" + mm + "/" + yyyy;
  }
  function getSpKey(d?: Date) {
    const dd = d || new Date();
    const y = dd.getFullYear();
    const m = String(dd.getMonth() + 1).padStart(2, "0");
    return "sp-seq-" + typeCode(poType) + "-" + y + m;
  }
  function readSeq(d?: Date) {
    try {
      const raw = localStorage.getItem(getSpKey(d));
      const n = raw ? parseInt(raw, 10) : 1;
      return isFinite(n) && n > 0 ? n : 1;
    } catch {
      return 1;
    }
  }
  function writeSeq(n: number, d?: Date) { try { localStorage.setItem(getSpKey(d), String(n)); } catch {} }
  useEffect(() => {
    if (spAuto) {
      const seq = readSeq();
      setHeader(h => Object.assign({}, h, { nomorSP: makeSpNumber(seq) }));
    }
  }, [spAuto, poType]);
  function incrementSp() {
    const now = new Date();
    const cur = readSeq(now);
    const next = cur + 1;
    writeSeq(next, now);
    setHeader(h => Object.assign({}, h, { nomorSP: makeSpNumber(next, now) }));
  }
  function decrementSp() {
    const now = new Date();
    const cur = readSeq(now);
    const next = Math.max(1, cur - 1);
    writeSeq(next, now);
    setHeader(h => Object.assign({}, h, { nomorSP: makeSpNumber(next, now) }));
  }

  // === ZAT AKTIF list (localStorage) ===
  const DEFAULT_PREKURSOR = [
    "Pseudoefedrin","Efedrin","Norefedrin","Ergometrin","Ergotamin","Anhidrida Asetat","Kalium Permanganat","Phenylpropanolamine HCl"
  ];
  const DEFAULT_OOT = ["Tramadol","Triheksifenidil","Dextromethorphan","Klonazepam","Clobazam"];
  function dedup(list: any[]) { const s: Record<string, boolean> = {}; const out: any[] = []; for (let i=0;i<(list||[]).length;i++){ const v=String(list[i]||"").trim(); if(!v) continue; const k=v.toLowerCase(); if(!s[k]){ s[k]=true; out.push(v); } } return out; }
  const [preList, setPreList] = useState<string[]>(() => { try { const v=JSON.parse(localStorage.getItem("zat-pre-list")||"null"); if (Array.isArray(v) && v.length) return dedup(v);} catch{} return dedup(DEFAULT_PREKURSOR); });
  const [ootList, setOotList] = useState<string[]>(() => { try { const v=JSON.parse(localStorage.getItem("zat-oot-list")||"null"); if (Array.isArray(v) && v.length) return dedup(v);} catch{} return dedup(DEFAULT_OOT); });
  useEffect(() => { try { localStorage.setItem("zat-pre-list", JSON.stringify(preList)); } catch{} }, [preList]);
  useEffect(() => { try { localStorage.setItem("zat-oot-list", JSON.stringify(ootList)); } catch{} }, [ootList]);

  const optionsZatAktif = useMemo(() => {
    if (poType === "Prekursor") return preList;
    if (poType === "Obat-obat tertentu") return ootList;
    return [];
  }, [poType, preList, ootList]);
  const zatOptions = useMemo(() => {
    const base = [{ value: "", label: "-- Pilih Zat Aktif --" }];
    const list = Array.isArray(optionsZatAktif) ? optionsZatAktif : [];
    for (let i=0;i<list.length;i++){ const x=list[i]; (base as any).push({ value: String(x), label: String(x) }); }
    return base;
  }, [optionsZatAktif]);

  // ===== FAVORIT ITEM =====
  const [favOpen, setFavOpen] = useState(false);
  const [favorites, setFavorites] = useState<any[]>(() => { try { const v = JSON.parse(localStorage.getItem('fav-items') || 'null'); return Array.isArray(v) ? v : []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('fav-items', JSON.stringify(favorites)); } catch {} }, [favorites]);
  function saveFavFromRow(idx:number){ const it = items[idx]; if(!it) return; const clean = { nama: it.nama||'', zatAktif: it.zatAktif||'', bentukKekuatan: it.bentukKekuatan||'', satuan: it.satuan||'', jumlah: it.jumlah||'', ket: it.ket||'' }; const key = JSON.stringify(clean); if (!favorites.some(f => JSON.stringify(f) === key)) { setFavorites(prev => prev.concat([clean])); } }
  function addFromFavorite(i:number){ const f = favorites[i]; if(!f) return; setItems(prev => prev.concat([Object.assign({}, f)])); }
  function deleteFavorite(i:number){ setFavorites(prev => prev.filter((_, idx) => idx !== i)); }

  // ===== TEMPLATE PBF =====
  const [pbfOpen, setPbfOpen] = useState(false);
  const [pbfTemplates, setPbfTemplates] = useState<any[]>(() => { try { const v = JSON.parse(localStorage.getItem('pbf-templates') || 'null'); return Array.isArray(v) ? v : []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('pbf-templates', JSON.stringify(pbfTemplates)); } catch {} }, [pbfTemplates]);
  function applyPbfTemplate(i:number){ const t = pbfTemplates[i]; if(!t) return; setPbf({ nama: t.nama||'', alamat: t.alamat||'', telp: t.telp||'' }); }
  function saveCurrentPbfAsTemplate(){ const t = { nama: pbf.nama||'', alamat: pbf.alamat||'', telp: pbf.telp||'' }; const key = JSON.stringify(t); if(!pbfTemplates.some(x => JSON.stringify(x) === key)) { setPbfTemplates(prev => prev.concat([t])); } }
  function deletePbfTemplate(i:number){ setPbfTemplates(prev => prev.filter((_, idx) => idx !== i)); }
  function renamePbfTemplate(i:number, field:string, val:string){ setPbfTemplates(prev => { const c = prev.slice(); if(!c[i]) return prev; c[i] = Object.assign({}, c[i], { [field]: val }); return c; }); }

  // ===== Nomor SP Unik (lokal + optional remote) =====
  const [spRemoteStatus, setSpRemoteStatus] = useState('');
  function loadUsedSpLocal(){ try { const v = JSON.parse(localStorage.getItem('sp-used-local') || '[]'); return Array.isArray(v) ? new Set(v) : new Set(); } catch { return new Set(); } }
  function saveUsedSpLocal(setv:Set<string>){ try { localStorage.setItem('sp-used-local', JSON.stringify(Array.from(setv))); } catch {} }
  const usedLocalSet = useMemo(() => loadUsedSpLocal(), [header.nomorSP]);
  const isSpUsedLocal = usedLocalSet.has(header.nomorSP || '');
  function markSpUsedLocal(num?:string){ const s = loadUsedSpLocal(); if(num) { s.add(num); saveUsedSpLocal(s); } }
  async function checkSpUniqueRemote(num?:string){ if(!hasSheets) { setSpRemoteStatus(''); return true; } try { setSpRemoteStatus('Memeriksa...'); const res = await fetch('/.netlify/functions/sheets-check-unique?num=' + encodeURIComponent(num || '')); const data = await res.json(); const dup = !!data.duplicate; setSpRemoteStatus(dup ? 'Duplikat di Sheets' : 'Unik di Sheets'); return !dup; } catch(e:any){ setSpRemoteStatus('Gagal cek: ' + (e.message || String(e))); return true; } }

  // Items
  function addRow(){ setItems(prev => prev.concat([{ nama: "", zatAktif: "", bentukKekuatan: "", satuan: "", jumlah: "", ket: "" }])); }
  function delRow(idx:number){ setItems(prev => prev.filter((_,i)=> i!==idx)); }
  function handleItemChange(idx:number, key:string, value:any){ setItems(prev => prev.map((it,i)=> i===idx ? Object.assign({}, it, { [key]: value }) : it)); }
  const showZatAktif = poType !== "Reguler";

  // Google Sheets (Netlify Functions)
  const [netStatus, setNetStatus] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  function assemblePayload(){ return { poType, header, pemesan, pbf, kebutuhan, tanggalTempat, items, savedAt: new Date().toISOString() }; }
  async function saveToGoogleSheets(){ try { setNetStatus("Menyimpan..."); const res = await fetch("/.netlify/functions/sheets-append", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload: assemblePayload() }) }); const data = await res.json(); if (data && data.error) throw new Error(data.error.message||"Gagal menyimpan"); setNetStatus("Tersimpan ke Google Sheets ✔"); setTimeout(()=> setNetStatus(""), 2500); } catch(e:any){ console.error(e); setNetStatus("Gagal menyimpan: "+ (e.message||e.toString())); } }
  async function loadHistory(){ try { setHistoryLoading(true); setHistoryError(""); const res = await fetch("/.netlify/functions/sheets-history"); const data = await res.json(); if (data && data.error) throw new Error(data.error.message||"Gagal memuat"); const rows = (data.rows || []) as any[]; setHistoryRows(rows); } catch(e:any){ console.error(e); setHistoryError(e.message||String(e)); } finally { setHistoryLoading(false); } }
  function restoreFromRow(row:any){ try { if (row && row.json) { const parsed = JSON.parse(row.json); if (parsed.poType) setPoType(parsed.poType); if (parsed.header) setHeader(parsed.header); if (parsed.pemesan) setPemesan(parsed.pemesan); if (parsed.pbf) setPbf(parsed.pbf); if (parsed.kebutuhan) setKebutuhan(parsed.kebutuhan); if (parsed.tanggalTempat) setTanggalTempat(parsed.tanggalTempat); if (parsed.items && parsed.items.length) setItems(parsed.items); setHistoryOpen(false); } else { alert("Baris ini tidak memiliki data JSON utuh untuk di-restore."); } } catch(e:any){ console.error(e); alert("Gagal memulihkan data: "+(e.message||e.toString())); } }

  /** ==== CETAK: tandai leluhur #po-print sebagai .po-keep lalu print ==== */
  const printDoc = () => {
    markSpUsedLocal(header.nomorSP);

    // tandai <html> agar CSS print menyembunyikan selain .po-keep
    document.documentElement.classList.add('printing-po');

    // tandai #po-print + semua leluhurnya .po-keep
    const po = document.getElementById('po-print');
    const kept: Element[] = [];
    let n: Element | null = po;
    while (n) {
      n.classList.add('po-keep');
      kept.push(n);
      if (n === document.body) break;
      n = n.parentElement;
    }

    window.print();

    const cleanup = () => {
      document.documentElement.classList.remove('printing-po');
      kept.forEach(el => el.classList.remove('po-keep'));
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
  };

  function newPO(){
    setPbf({ nama: "", alamat: "", telp: "" });
    setItems([{ nama: "", zatAktif: "", bentukKekuatan: "", satuan: "", jumlah: "", ket: "" }]);
    if (spAuto) incrementSp();
  }

  const line = useMemo(() => <div className="w-full h-px bg-gray-400 my-2" />, []);
  function formatJumlah(val:any){ const n=parseInt(val,10); if(!isFinite(n)) return val||""; return String(n); }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {PrintCSS}

      {/* Toolbar (tidak dicetak) */}
      <div className="no-print sticky top-0 z-10 border-b bg-white/80 backdrop-blur px-4 py-3 flex items-center gap-2">
        <h1 className="text-lg font-semibold">Purchase Order – Builder (Lengkap)</h1>
        <div className="ml-auto flex gap-2">
          <button onClick={newPO} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">PO Baru</button>
          <button onClick={addRow} className="px-3 py-2 rounded-xl shadow text-sm border h
