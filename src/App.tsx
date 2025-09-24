
function OrderTypeAndSPCard({
  poType, setPoType,
  header, setHeader,
  spAuto, setSpAuto,
  decrementSp, incrementSp,
  isSpUsedLocal, spRemoteStatus, checkSpUniqueRemote,
}: {
  poType: string;
  setPoType: (v: string) => void;
  header: any;
  setHeader: (fn: (h:any)=>any) => void;
  spAuto: boolean;
  setSpAuto: (v: boolean) => void;
  decrementSp: () => void;
  incrementSp: () => void;
  isSpUsedLocal: boolean;
  spRemoteStatus: string;
  checkSpUniqueRemote: (num?: string)=>Promise<boolean>;
}) {
  return (
    <Card title="Jenis PO · Nomor SP">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-4">
          <Select
            label="Jenis PO"
            value={poType}
            onChange={setPoType}
            options={["Reguler","Prekursor","Obat-obat tertentu"]}
          />
        </div>
        <div className="lg:col-span-5">
          <Input
            label="Nomor SP"
            value={header.nomorSP}
            onChange={(v: string) => setHeader((h:any) => ({ ...h, nomorSP: v }))}
            placeholder="NNN/SP/REG/MM/YYYY"
          />
          <div className="mt-1 text-[13px]">
            <span className="text-gray-600">Status lokal: </span>
            <span className={isSpUsedLocal ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
              {isSpUsedLocal ? "Duplikat" : "Belum pernah dipakai"}
            </span>
            <span className="text-gray-400"> · </span>
            <button
              type="button"
              onClick={() => checkSpUniqueRemote(header.nomorSP)}
              className="underline hover:opacity-80"
              title="Periksa ke Google Sheets"
            >
              Cek unik ke Sheets
            </button>
            {spRemoteStatus && (
              <>
                <span className="text-gray-400"> — </span>
                <span
                  className={
                    /unik/i.test(spRemoteStatus)
                      ? "text-emerald-600"
                      : /duplikat/i.test(spRemoteStatus)
                      ? "text-red-600"
                      : "text-gray-600"
                  }
                >
                  {spRemoteStatus}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="lg:col-span-3 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={spAuto}
              onChange={(e) => setSpAuto((e.target as HTMLInputElement).checked)}
            />
            Nomor SP otomatis (per jenis)
          </label>
          <div className="flex gap-2">
            <button onClick={decrementSp} className="px-3 py-2 rounded-xl border text-sm">Turunkan</button>
            <button onClick={incrementSp} className="px-3 py-2 rounded-xl border text-sm">Naikkan</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

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
  /** ====== PRINT CSS (A4, clone-only) ====== */
  const PrintCSS = (
    <style>{`
    @page { size: A4 portrait; margin: 12mm; }
    @media print {
      html, body { visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
      #po-print, #po-print * { visibility: visible !important; }
      #po-print {
        position: absolute !important;
        top: 0 !important; left: 0 !important; right: 0 !important;
        margin: 0 auto !important;
        width: 186mm !important;
        padding: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
        page-break-after: avoid !important;
      }
      #po-print table { border-collapse: collapse !important; }
      #po-print th, #po-print td { border: 1px solid #000 !important; }
      #po-print, #po-print table, #po-print tr, #po-print img {
        break-inside: avoid; page-break-inside: avoid;
      }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `}</style>
  );

  /** ====== FLAGS ====== */
  const hasSheets = true; // Netlify Functions untuk Google Sheets

  /** ====== STATE UTAMA ====== */
  const [poType, setPoType] = useState("Prekursor"); // Reguler | Prekursor | Obat-obat tertentu
  const [spAuto, setSpAuto] = useState(true);
  const [showMeta, setShowMeta] = useState(false);

  const [header, setHeader] = useState({
    namaFaskes: "KLINIK BANGUN HUSADA",
    izin: "Izin Klinik : 503 / 4736 / 83 / DKS / 2021",
    alamat: "Jl. Perumnas 207 Gorongan, Condongcatur, Depok, Sleman",
    telp: "Telp : (0274) 488314",
    judul: "SURAT PESANAN",
    nomorSP: "",
    logoUrl: "https://iili.io/KBiv0xa.png",
    /** ===== TTD (gambar/scan) ===== */
    ttdUrl: "https://iili.io/KBb62lS.png",
    ttdHeightMm: 50,
    ttdAreaHeightMm: 18,
    ttdX: 171,
    ttdY: 37,
    ttdScale: 1
  } as any);

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

  /** ====== NOMOR SP ====== */
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
      setHeader((h:any) => Object.assign({}, h, { nomorSP: makeSpNumber(seq) }));
    }
  }, [spAuto, poType]);
  function incrementSp() {
    const now = new Date();
    const cur = readSeq(now);
    const next = cur + 1;
    writeSeq(next, now);
    setHeader((h:any) => Object.assign({}, h, { nomorSP: makeSpNumber(next, now) }));
  }
  function decrementSp() {
    const now = new Date();
    const cur = readSeq(now);
    const next = Math.max(1, cur - 1);
    writeSeq(next, now);
    setHeader((h:any) => Object.assign({}, h, { nomorSP: makeSpNumber(next, now) }));
  }

  /** ====== ZAT AKTIF (localStorage) ====== */
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

  /** ====== PANEL KELola LIST ====== */
  const [zOpen, setZOpen] = useState(false);
  const [preNew, setPreNew] = useState("");
  const [ootNew, setOotNew] = useState("");
  function addPre(){ const v=preNew.trim(); if(!v) return; setPreList(p => dedup(p.concat([v]))); setPreNew(""); }
  function addOOT(){ const v=ootNew.trim(); if(!v) return; setOotList(p => dedup(p.concat([v]))); setOotNew(""); }
  function delPre(i:number){ setPreList(p => p.filter((_,idx)=> idx!==i)); }
  function delOOT(i:number){ setOotList(p => p.filter((_,idx)=> idx!==i)); }
  function renamePre(i:number, val:string){ setPreList(p => { const c=p.slice(); c[i]=val; return dedup(c); }); }
  function renameOOT(i:number, val:string){ setOotList(p => { const c=p.slice(); c[i]=val; return dedup(c); }); }
  function resetZat(){ if (confirm("Kembalikan daftar ke bawaan? (Semua perubahan akan dihapus)")) { setPreList(dedup(DEFAULT_PREKURSOR)); setOotList(dedup(DEFAULT_OOT)); } }

  /** ====== FAVORIT ITEM ====== */
  const [favOpen, setFavOpen] = useState(false);
  const [favorites, setFavorites] = useState<any[]>(() => { try { const v = JSON.parse(localStorage.getItem('fav-items') || 'null'); return Array.isArray(v) ? v : []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('fav-items', JSON.stringify(favorites)); } catch {} }, [favorites]);
  function saveFavFromRow(idx:number){ const it = items[idx]; if(!it) return; const clean = { nama: it.nama||'', zatAktif: it.zatAktif||'', bentukKekuatan: it.bentukKekuatan||'', satuan: it.satuan||'', jumlah: it.jumlah||'', ket: it.ket||'' }; const key = JSON.stringify(clean); if (!favorites.some(f => JSON.stringify(f) === key)) { setFavorites(prev => prev.concat([clean])); } }
  function addFromFavorite(i:number){ const f = favorites[i]; if(!f) return; setItems(prev => prev.concat([Object.assign({}, f)])); }
  function deleteFavorite(i:number){ setFavorites(prev => prev.filter((_, idx) => idx !== i)); }

  /** ====== TEMPLATE PBF ====== */
  const [pbfOpen, setPbfOpen] = useState(false);
  const [pbfTemplates, setPbfTemplates] = useState<any[]>(() => { try { const v = JSON.parse(localStorage.getItem('pbf-templates') || 'null'); return Array.isArray(v) ? v : []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('pbf-templates', JSON.stringify(pbfTemplates)); } catch {} }, [pbfTemplates]);
  function applyPbfTemplate(i:number){ const t = pbfTemplates[i]; if(!t) return; setPbf({ nama: t.nama||'', alamat: t.alamat||'', telp: t.telp||'' }); }
  function saveCurrentPbfAsTemplate(){ const t = { nama: pbf.nama||'', alamat: pbf.alamat||'', telp: pbf.telp||'' }; const key = JSON.stringify(t); if(!pbfTemplates.some(x => JSON.stringify(x) === key)) { setPbfTemplates(prev => prev.concat([t])); } }
  function deletePbfTemplate(i:number){ setPbfTemplates(prev => prev.filter((_, idx) => idx !== i)); }
  function renamePbfTemplate(i:number, field:string, val:string){ setPbfTemplates(prev => { const c = prev.slice(); if(!c[i]) return prev; c[i] = Object.assign({}, c[i], { [field]: val }); return c; }); }

  /** ====== NOMOR SP UNIK (lokal & remote) ====== */
  const [spRemoteStatus, setSpRemoteStatus] = useState('');
  function loadUsedSpLocal(){ try { const v = JSON.parse(localStorage.getItem('sp-used-local') || '[]'); return Array.isArray(v) ? new Set(v) : new Set(); } catch { return new Set(); } }
  function saveUsedSpLocal(setv:Set<string>){ try { localStorage.setItem('sp-used-local', JSON.stringify(Array.from(setv))); } catch {} }
  const usedLocalSet = useMemo(() => loadUsedSpLocal(), [header.nomorSP]);
  const isSpUsedLocal = usedLocalSet.has(header.nomorSP || '');
  function markSpUsedLocal(num?:string){ const s = loadUsedSpLocal(); if(num) { s.add(num); saveUsedSpLocal(s); } }
  async function checkSpUniqueRemote(num?:string){
    if(!hasSheets) { setSpRemoteStatus(''); return true; }
    try {
      setSpRemoteStatus('Memeriksa...');
      const res = await fetch('/.netlify/functions/sheets-check-unique?num=' + encodeURIComponent(num || ''));
      const data = await res.json();
      const dup = !!data.duplicate;
      setSpRemoteStatus(dup ? 'Duplikat di Sheets' : 'Unik di Sheets');
      return !dup;
    } catch(e:any){
      setSpRemoteStatus('Gagal cek: ' + (e.message || String(e)));
      return true;
    }
  }

  /** ====== ITEMS ====== */
  function addRow(){ setItems(prev => prev.concat([{ nama: "", zatAktif: "", bentukKekuatan: "", satuan: "", jumlah: "", ket: "" }])); }
  function delRow(idx:number){ setItems(prev => prev.filter((_,i)=> i!==idx)); }
  function handleItemChange(idx:number, key:string, value:any){ setItems(prev => prev.map((it,i)=> i===idx ? Object.assign({}, it, { [key]: value }) : it)); }
  const showZatAktif = poType !== "Reguler";

  /** ====== GOOGLE SHEETS (Netlify Functions) ====== */
  const [netStatus, setNetStatus] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  function assemblePayload(){ return { poType, header, pemesan, pbf, kebutuhan, tanggalTempat, items, savedAt: new Date().toISOString() }; }
  async function saveToGoogleSheets(){
    try {
      setNetStatus("Menyimpan...");
      const res = await fetch("/.netlify/functions/sheets-append", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: assemblePayload() })
      });
      const data = await res.json();
      if (data && data.error) throw new Error(data.error.message||"Gagal menyimpan");
      setNetStatus("Tersimpan ke Google Sheets ✔");
      setTimeout(()=> setNetStatus(""), 2500);
    } catch(e:any){
      console.error(e);
      setNetStatus("Gagal menyimpan: "+ (e.message||e.toString()));
    }
  }
  async function loadHistory(){
    try {
      setHistoryLoading(true); setHistoryError("");
      const res = await fetch("/.netlify/functions/sheets-history");
      const data = await res.json();
      if (data && data.error) throw new Error(data.error.message||"Gagal memuat");
      const rows = (data.rows || []) as any[];
      setHistoryRows(rows);
    } catch(e:any){
      console.error(e); setHistoryError(e.message||String(e));
    } finally { setHistoryLoading(false); }
  }
  function restoreFromRow(row:any){
    try {
      if (row && row.json) {
        const parsed = JSON.parse(row.json);
        if (parsed.poType) setPoType(parsed.poType);
        if (parsed.header) setHeader(parsed.header);
        if (parsed.pemesan) setPemesan(parsed.pemesan);
        if (parsed.pbf) setPbf(parsed.pbf);
        if (parsed.kebutuhan) setKebutuhan(parsed.kebutuhan);
        if (parsed.tanggalTempat) setTanggalTempat(parsed.tanggalTempat);
        if (parsed.items && parsed.items.length) setItems(parsed.items);
        setHistoryOpen(false);
      } else {
        alert("Baris ini tidak memiliki data JSON utuh untuk di-restore.");
      }
    } catch(e:any){
      console.error(e);
      alert("Gagal memulihkan data: "+(e.message||e.toString()));
    }
  }

  /** ====== UTIL ====== */
  function terbilangID(num:any){ let n = Math.floor(Math.abs(Number(num) || 0)); if (n === 0) return "nol";
    const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
    function tigaDigit(x:number){ let out=""; if (x >= 100){ if (x===100) return "seratus"; if (x<200) return "seratus "+tigaDigit(x-100); const r=Math.floor(x/100); out+=angka[r]+" ratus"; x=x%100; if(x) out+=" "+tigaDigit(x); return out; }
      if (x >= 20){ const p=Math.floor(x/10); out+=angka[p]+" puluh"; const s=x%10; if(s) out+=" "+angka[s]; return out; }
      if (x >= 12) return angka[x-10]+" belas"; if (x===11) return "sebelas"; if (x===10) return "sepuluh"; return angka[x]; }
    const skala=["", "ribu", "juta", "miliar", "triliun"], parts:string[]=[]; let i=0; while(n>0){ const rem=n%1000; if(rem){ let ch=tigaDigit(rem); if(i===1 && rem===1) ch="seribu"; else if(i>0) ch+=" "+skala[i]; parts.unshift(ch); } n=Math.floor(n/1000); i++; } return parts.join(" "); }
  function capFirst(s:string){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function formatJumlah(val:any){ const n=parseInt(val,10); if(!isFinite(n)) return val||""; return String(n)+" ("+capFirst(terbilangID(n))+")"; }

  /** ====== DRAG TTD ====== */
  const [dragging, setDragging] = useState(false);
  const dragRef = React.useRef<{startX:number; startY:number; x0:number; y0:number} | null>(null);
  function onSigMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, x0: header.ttdX || 0, y0: header.ttdY || 0 };
  }
  function onSigMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setHeader((h:any) => ({...h, ttdX: dragRef.current!.x0 + dx, ttdY: dragRef.current!.y0 + dy}));
  }
  function onSigMouseUp() { setDragging(false); dragRef.current = null; }

  /** ====== CETAK (clone supaya 1 halaman) ====== */
  const printDoc = () => {
    try {
      markSpUsedLocal(header.nomorSP);
      const src = document.getElementById('po-print');
      if (!src) { window.print(); return; }
      const clone = src.cloneNode(true) as HTMLElement;
      clone.id = 'print-clone';
      document.body.appendChild(clone);
      document.body.classList.add('printing');
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing');
          try { clone.remove(); } catch {}
        }, 100);
      }, 50);
    } catch { window.print(); }
  };

  function newPO(){
    setPbf({ nama: "", alamat: "", telp: "" });
    setItems([{ nama: "", zatAktif: "", bentukKekuatan: "", satuan: "", jumlah: "", ket: "" }]);
    if (spAuto) incrementSp();
  }

  /** ====== UI ====== */
  const line = useMemo(() => <div className="w-full h-px bg-gray-400 my-2" />, []);

  /** ====== API KEY OPSIONAL (untuk secure fungsi PBF) ====== */
  const API_KEY_HEADER: Record<string, string> | undefined = undefined;
  // Jika kamu set env API_KEY di Netlify, aktifkan baris berikut:
  // const API_KEY_HEADER = { "x-api-key": "ISI_SAMA_DENGAN_ENV_API_KEY" };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {PrintCSS}

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 border-b bg-white/80 backdrop-blur px-4 py-3 flex items-center gap-2">
        <h1 className="text-lg font-semibold">Purchase Order – Builder (Lengkap)</h1>
        <div className="ml-auto flex gap-2">
          <button onClick={newPO} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">PO Baru</button>
          <button onClick={addRow} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Tambah Baris</button>
          <button onClick={()=> setZOpen(true)} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Kelola Zat Aktif</button>
          <button onClick={()=> { setHistoryOpen(true); loadHistory(); }} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Riwayat</button>
          {hasSheets && (
            <button onClick={saveToGoogleSheets} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Simpan ke Google Sheets</button>
          )}
          <button onClick={printDoc} className="px-3 py-2 rounded-xl shadow text-sm bg-black text-white hover:opacity-90">Cetak / Simpan PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
        {/* ===== FORM ===== */}
        <section className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Mode fokus pengisian</div>
              <div className="text-xs">Bagian Identitas, Pemesan, dan Kebutuhan Faskes disembunyikan agar fokus ke Tujuan PBF & Daftar Item.</div>
            </div>
            <button onClick={()=> setShowMeta(v=>!v)} className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-50">{showMeta ? 'Sembunyikan' : 'Edit identitas'}</button>
          </div>

          <OrderTypeAndSPCard
  poType={poType}
  setPoType={setPoType}
  header={header}
  setHeader={setHeader}
  spAuto={spAuto}
  setSpAuto={setSpAuto}
  decrementSp={decrementSp}
  incrementSp={incrementSp}
  isSpUsedLocal={isSpUsedLocal}
  spRemoteStatus={spRemoteStatus}
  checkSpUniqueRemote={checkSpUniqueRemote}
/>

          {showMeta && (
            <Card title="Identitas Fasilitas Kesehatan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Judul Dokumen" value={header.judul} onChange={(v:string)=> setHeader((h:any)=> ({...h, judul:v}))} />
                <Input label="Nama Faskes" value={header.namaFaskes} onChange={(v:string)=> setHeader((h:any)=> ({...h, namaFaskes:v}))} />
                <Input label="Izin" value={header.izin} onChange={(v:string)=> setHeader((h:any)=> ({...h, izin:v}))} />
                <Input label="Telp" value={header.telp} onChange={(v:string)=> setHeader((h:any)=> ({...h, telp:v}))} />
                <Input label="Alamat" className="md:col-span-2" value={header.alamat} onChange={(v:string)=> setHeader((h:any)=> ({...h, alamat:v}))} />
                <Input label="Logo URL (opsional)" className="md:col-span-2" value={header.logoUrl} onChange={(v:string)=> setHeader((h:any)=> ({...h, logoUrl:v}))} placeholder="https://.../logo.png" />
                {/* TTD */}
                <Input label="Tanda Tangan URL (opsional)" className="md:col-span-2" value={header.ttdUrl} onChange={(v:string)=> setHeader((h:any)=> ({...h, ttdUrl:v}))} placeholder="https://.../tanda-tangan.png" />
                <Input label="Tinggi maksimal TTD (mm)" value={String(header.ttdHeightMm)} onChange={(v:string)=> setHeader((h:any)=> ({...h, ttdHeightMm: Math.max(10, Math.min(60, parseInt(v||'22',10) || 22))}))} type="number" />
                <Input label="Tinggi ruang TTD (mm) — jarak Pemesan ↔ Nama" value={String(header.ttdAreaHeightMm)} onChange={(v:string)=> setHeader((h:any)=> ({...h, ttdAreaHeightMm: Math.max(10, Math.min(60, parseInt(v||'18',10) || 18))}))} type="number" />
                <div className="md:col-span-2 grid grid-cols-3 gap-3">
                  <Input label="Posisi X (px)" value={String(header.ttdX)} onChange={(v:string)=> setHeader((h:any)=> ({...h, ttdX: parseInt(v||'0',10) || 0}))} type="number" />
                  <Input label="Posisi Y (px)" value={String(header.ttdY)} onChange={(v:string)=> setHeader((h:any)=> ({...h, ttdY: parseInt(v||'0',10) || 0}))} type="number" />
                  <label className="block">
                    <span className="text-xs text-gray-600">Scale (%)</span>
                    <input
                      type="range" min={50} max={200} step={1}
                      value={Math.round((header.ttdScale ?? 1)*100)}
                      onChange={(e)=> setHeader((h:any)=> ({...h, ttdScale: Math.max(0.5, Math.min(2, Number((e.target as HTMLInputElement).value)/100))}))}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-600 mt-1">{Math.round((header.ttdScale ?? 1)*100)}%</div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {showMeta && (
            <Card title="Pemesan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Nama" value={pemesan.nama} onChange={(v:string)=> setPemesan(p=> ({...p, nama:v}))} />
                <Input label="Jabatan" value={pemesan.jabatan} onChange={(v:string)=> setPemesan(p=> ({...p, jabatan:v}))} />
                <Input label="Nomor SIPA" className="md:col-span-2" value={pemesan.sipa} onChange={(v:string)=> setPemesan(p=> ({...p, sipa:v}))} />
              </div>
            </Card>
          )}

          {showMeta && (
            <Card title="Kebutuhan Faskes">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Nama Klinik" value={kebutuhan.namaKlinik} onChange={(v:string)=> setKebutuhan(k=> ({...k, namaKlinik:v}))} />
                <Input label="No. Izin" value={kebutuhan.noIzin} onChange={(v:string)=> setKebutuhan(k=> ({...k, noIzin:v}))} />
                <Input label="Alamat" className="md:col-span-2" value={kebutuhan.alamat} onChange={(v:string)=> setKebutuhan(k=> ({...k, alamat:v}))} />
              </div>
            </Card>
          )}

          <Card title="Mengajukan pesanan obat kepada">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-2">
              <label className="block">
                <span className="text-xs text-gray-600">Template PBF</span>
                <select onChange={(e)=> { const i = parseInt((e.target as HTMLSelectElement).value,10); if(!isNaN(i) && i>=0) applyPbfTemplate(i); (e.target as HTMLSelectElement).value='-1'; }} defaultValue="-1" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white">
                  <option value="-1">-- Pilih Template --</option>
                  {pbfTemplates.map((t:any,i:number)=> (<option key={i} value={i}>{t.nama||('Template '+(i+1))}</option>))}
                </select>
              </label>
              <button onClick={saveCurrentPbfAsTemplate} className="px-3 py-2 rounded-xl border text-sm">Simpan sebagai Template</button>
              <button onClick={()=> setPbfOpen(true)} className="px-3 py-2 rounded-xl border text-sm">Kelola Template</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Nama PBF" value={pbf.nama} onChange={(v:string)=> setPbf({...pbf, nama:v})} />
              <Input label="Telepon" value={pbf.telp} onChange={(v:string)=> setPbf({...pbf, telp:v})} />
              <Input label="Alamat" className="md:col-span-2" value={pbf.alamat} onChange={(v:string)=> setPbf({...pbf, alamat:v})} />
            </div>
          </Card>

          <Card title="Daftar Item">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600">Kelola item</div>
              <div className="flex gap-2">
                <button onClick={()=> setFavOpen(true)} className="text-xs px-2 py-1 border rounded-lg">Tambah dari Favorit</button>
                <button onClick={addRow} className="text-xs px-2 py-1 border rounded-lg">Tambah Baris</button>
              </div>
            </div>
            <div className="space-y-4">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-4">
                    <Input label={`Nama Obat #${idx+1}`} placeholder="Nama Obat" value={it.nama} onChange={(v:string)=> handleItemChange(idx, 'nama', v)} />
                  </div>
                  {showZatAktif && (
                    <div className="col-span-6 md:col-span-2">
                      <Select label="Zat Aktif" value={it.zatAktif || ''} onChange={(v:string)=> handleItemChange(idx, 'zatAktif', v)} options={zatOptions} />
                    </div>
                  )}
                  <div className="col-span-6 md:col-span-3">
                    <Input label="Bentuk & Kekuatan" value={it.bentukKekuatan} onChange={(v:string)=> handleItemChange(idx, 'bentukKekuatan', v)} />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Input label="Satuan" value={it.satuan} onChange={(v:string)=> handleItemChange(idx, 'satuan', v)} />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Input label="Jumlah" placeholder="Jumlah" value={String(it.jumlah || '')} onChange={(v:string)=> handleItemChange(idx, 'jumlah', v)} />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Input label="Ket" value={it.ket} onChange={(v:string)=> handleItemChange(idx, 'ket', v)} />
                  </div>
                  <div className="col-span-12 flex justify-between gap-2">
                    <button onClick={()=> saveFavFromRow(idx)} className="text-xs px-2 py-1 border rounded-lg">Simpan ke Favorit</button>
                    <div className="flex gap-2">
                      <button onClick={addRow} className="text-xs px-2 py-1 border rounded-lg">Tambah</button>
                      {items.length > 1 && (
                        <button onClick={()=> delRow(idx)} className="text-xs px-2 py-1 border rounded-lg">Hapus</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ===== PREVIEW / CETAK ===== */}
        <section>
          <div id="po-print" className="print-page bg-white shadow-sm rounded-2xl p-6">
            {/* KOP */}
            <div className="flex items-start gap-4">
              {header.logoUrl ? (
                <img src={header.logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-contain border" />
              ) : (
                <div className="shrink-0 w-16 h-16 rounded-full border grid place-items-center text-xs text-gray-500">LOGO</div>
              )}
              <div className="grow">
                <h2 className="font-semibold text-xl tracking-wide">{header.namaFaskes}</h2>
                <p className="text-sm leading-snug">{header.izin}<br/>{header.alamat}<br/>{header.telp}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-extrabold leading-tight">{header.judul || 'SURAT PESANAN'}</div>
                <div className="text-xl font-bold tracking-wide">{typeUpper(poType)}</div>
              </div>
            </div>
            {line}

            <div className="text-center text-sm">
              <div><span className="font-medium">Nomor SP : </span><span>{header.nomorSP}</span></div>
            </div>

            {/* PEMESAN */}
            <div className="mt-4 text-sm space-y-1">
              <p><span className="inline-block w-56">Yang bertanda tangan di bawah ini</span>:</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2">
                <span>Nama</span><span>: {pemesan.nama}</span>
                <span>Jabatan</span><span>: {pemesan.jabatan}</span>
                <span>Nomor SIPA</span><span>: {pemesan.sipa}</span>
              </div>
            </div>

            {/* TUJUAN */}
            <div className="mt-4 text-sm space-y-1">
              <p>Mengajukan pesanan obat kepada :</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2">
                <span>Nama PBF</span><span>: {pbf.nama}</span>
                <span>Alamat</span><span>: {pbf.alamat}</span>
                <span>Telp.</span><span>: {pbf.telp || '-'}</span>
              </div>
            </div>

            {/* TABEL */}
            <div className="mt-4">
              <table className="w-full text-xs border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-black w-10">No</th>
                    <th className="p-2 border border-black">Nama Obat</th>
                    {showZatAktif && <th className="p-2 border border-black">Zat Aktif</th>}
                    <th className="p-2 border border-black">Bentuk dan Kekuatan</th>
                    <th className="p-2 border border-black">Satuan</th>
                    <th className="p-2 border border-black">Jumlah</th>
                    <th className="p-2 border border-black">Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-black text-center">{i + 1}</td>
                      <td className="p-2 border border-black text-left">{it.nama || ''}</td>
                      {showZatAktif && <td className="p-2 border border-black text-left">{it.zatAktif || ''}</td>}
                      <td className="p-2 border border-black text-left">{it.bentukKekuatan || ''}</td>
                      <td className="p-2 border border-black text-center">{it.satuan || ''}</td>
                      <td className="p-2 border border-black text-center">{String(it.jumlah || '')}</td>
                      <td className="p-2 border border-black text-left">{it.ket || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* KEBUTUHAN */}
            <div className="mt-4 text-sm space-y-1">
              <p>Obat tersebut akan digunakan untuk memenuhi kebutuhan :</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2">
                <span>Nama Klinik</span><span>: {kebutuhan.namaKlinik}</span>
                <span>Alamat</span><span>: {kebutuhan.alamat}</span>
                <span>No. Izin</span><span>: {kebutuhan.noIzin}</span>
              </div>
            </div>

            {/* TANDA TANGAN (overlay; jarak tetap & pendek) */}
            <div className="mt-8 text-sm">
              <div className="flex justify-end">
                <div className="w-80 text-center avoid-break">
                  <p>{tanggalTempat.tempat}, {tanggalTempat.tanggal}</p>
                  <p>Pemesan</p>

                  {header.ttdUrl ? (
                    <div
                      className={`${dragging ? 'select-none' : ''}`}
                      style={{
                        position: 'relative',
                        height: `${header.ttdAreaHeightMm}mm`,
                        overflow: 'visible',
                      }}
                      onMouseMove={onSigMouseMove}
                      onMouseUp={onSigMouseUp}
                      onMouseLeave={onSigMouseUp}
                      title="Drag untuk memindahkan tanda tangan"
                    >
                      <div
                        onMouseDown={onSigMouseDown}
                        style={{
                          position: 'absolute',
                          left: `${header.ttdX}px`,
                          top:  `${header.ttdY}px`,
                          transform: `translate(-50%, -50%) scale(${header.ttdScale})`,
                          cursor: 'move',
                        }}
                      >
                        <img
                          src={header.ttdUrl}
                          alt="Tanda tangan"
                          style={{
                            maxHeight: `${header.ttdHeightMm}mm`,
                            maxWidth: '100%',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                          draggable={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: `${header.ttdAreaHeightMm}mm` }} />
                  )}

                  <p className="font-semibold">{pemesan.nama}</p>
                  <p className="text-xs">SIPA : {pemesan.sipa}</p>
                </div>
              </div>
            </div>

            {netStatus && <p className="mt-4 text-xs text-gray-600">{netStatus}</p>}
          </div>
        </section>
      </div>

      {/* ========== PANELS ========== */}
      {/* Kelola Zat Aktif */}
      {zOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={()=> setZOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">Kelola Zat Aktif</h3>
              <div className="ml-auto flex gap-2">
                <button onClick={resetZat} className="px-3 py-2 border rounded-lg text-sm">Reset ke Default</button>
                <button onClick={()=> setZOpen(false)} className="px-3 py-2 border rounded-lg text-sm">Tutup</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Prekursor (Tambah/Ubah)</h4>
                <div className="flex gap-2 mb-3">
                  <input value={preNew} onChange={(e)=> setPreNew((e.target as HTMLInputElement).value)} placeholder="Tambah zat aktif prekursor..." className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                  <button onClick={addPre} className="px-3 py-2 border rounded-lg text-sm">Tambah</button>
                </div>
                <div className="space-y-2">
                  {preList.length === 0 && <div className="text-xs text-gray-500">Belum ada item.</div>}
                  {preList.map((v,i)=> (
                    <div key={i} className="flex items-center gap-2">
                      <input value={v} onChange={(e)=> renamePre(i, (e.target as HTMLInputElement).value)} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                      <button onClick={()=> delPre(i)} className="px-2 py-2 border rounded-lg text-xs">Hapus</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Obat-obat Tertentu (Tambah/Ubah)</h4>
                <div className="flex gap-2 mb-3">
                  <input value={ootNew} onChange={(e)=> setOotNew((e.target as HTMLInputElement).value)} placeholder="Tambah zat aktif OOT..." className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                  <button onClick={addOOT} className="px-3 py-2 border rounded-lg text-sm">Tambah</button>
                </div>
                <div className="space-y-2">
                  {ootList.length === 0 && <div className="text-xs text-gray-500">Belum ada item.</div>}
                  {ootList.map((v,i)=> (
                    <div key={i} className="flex items-center gap-2">
                      <input value={v} onChange={(e)=> renameOOT(i, (e.target as HTMLInputElement).value)} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                      <button onClick={()=> delOOT(i)} className="px-2 py-2 border rounded-lg text-xs">Hapus</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-6 text-xs text-gray-500">Perubahan tersimpan otomatis di perangkat ini (localStorage).</p>
          </div>
        </div>
      )}

      {/* Favorit */}
      {favOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={()=> setFavOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">Favorit Item</h3>
              <div className="ml-auto flex gap-2">
                <button onClick={()=> setFavOpen(false)} className="px-3 py-2 border rounded-lg text-sm">Tutup</button>
              </div>
            </div>
            {favorites.length===0 ? (
              <p className="text-sm text-gray-600">Belum ada favorit. Gunakan tombol <b>Simpan ke Favorit</b> pada baris item.</p>
            ) : (
              <div className="space-y-2">
                {favorites.map((f,i)=> (
                  <div key={i} className="border rounded-xl p-3 text-sm flex items-center gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{f.nama}</div>
                      <div className="text-xs text-gray-600">{f.zatAktif ? ('Zat aktif: '+f.zatAktif+' · ') : ''}{f.bentukKekuatan} · {f.satuan} · Jml: {String(f.jumlah||'')}</div>
                    </div>
                    <button onClick={()=> addFromFavorite(i)} className="px-2 py-1 border rounded-lg text-xs">Tambah ke Item</button>
                    <button onClick={()=> deleteFavorite(i)} className="px-2 py-1 border rounded-lg text-xs">Hapus</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template PBF */}
      {pbfOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={()=> setPbfOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">Kelola Template PBF</h3>
              <div className="ml-auto flex gap-2">
                {/* ====== Tambahan tombol sinkron PBF ke Google Sheets ====== */}
                <button
                  onClick={async () => {
                    try {
                      const r = await fetch("/.netlify/functions/sheets-pbf", {
                        headers: API_KEY_HEADER ? API_KEY_HEADER : {}
                      });
                      const data = await r.json();
                      if (!r.ok) throw new Error(data?.error || "Gagal memuat");
                      if (Array.isArray(data.templates)) setPbfTemplates(data.templates);
                      alert("Berhasil tarik Template PBF dari Google Sheets.");
                    } catch (e:any) {
                      alert("Gagal tarik dari Sheets: " + (e?.message || String(e)));
                    }
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  Tarik dari Sheets
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/.netlify/functions/sheets-pbf", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(API_KEY_HEADER || {})
                        },
                        body: JSON.stringify({ templates: pbfTemplates }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data?.error || "Gagal simpan");
                      alert("Berhasil kirim Template PBF ke Google Sheets.");
                    } catch (e:any) {
                      alert("Gagal kirim ke Sheets: " + (e?.message || String(e)));
                    }
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  Kirim ke Sheets
                </button>

                <button onClick={()=> setPbfOpen(false)} className="px-3 py-2 border rounded-lg text-sm">Tutup</button>
              </div>
            </div>
            {pbfTemplates.length===0 && <p className="text-sm text-gray-600">Belum ada template. Isi data PBF lalu klik <b>Simpan sebagai Template</b>, atau <b>Tarik dari Sheets</b>.</p>}
            <div className="space-y-3">
              {pbfTemplates.map((t,i)=> (
                <div key={i} className="border rounded-xl p-3 text-sm grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <Input label="Nama" value={t.nama} onChange={(v:string)=> renamePbfTemplate(i,'nama',v)} />
                  <Input label="Telepon" value={t.telp} onChange={(v:string)=> renamePbfTemplate(i,'telp',v)} />
                  <Input label="Alamat" className="md:col-span-3" value={t.alamat} onChange={(v:string)=> renamePbfTemplate(i,'alamat',v)} />
                  <div className="md:col-span-3 flex justify-end gap-2">
                    <button onClick={()=> applyPbfTemplate(i)} className="px-2 py-1 border rounded-lg text-xs">Gunakan</button>
                    <button onClick={()=> deletePbfTemplate(i)} className="px-2 py-1 border rounded-lg text-xs">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={saveCurrentPbfAsTemplate} className="px-3 py-2 border rounded-lg text-sm">Simpan sebagai Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Riwayat */}
      {historyOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={()=> setHistoryOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">Riwayat (Google Sheets)</h3>
              <div className="ml-auto flex gap-2">
                <button onClick={()=> setHistoryOpen(false)} className="px-3 py-2 border rounded-lg text-sm">Tutup</button>
              </div>
            </div>
            {historyLoading && <p className="text-sm">Memuat...</p>}
            {historyError && <p className="text-sm text-red-600">Error: {historyError}</p>}
            {!historyLoading && !historyError && (
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Tanggal</th>
                    <th className="p-2 border">Nomor SP</th>
                    <th className="p-2 border">Jenis</th>
                    <th className="p-2 border">Ringkasan</th>
                    <th className="p-2 border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((r:any) => (
                    <tr key={r.idx}>
                      <td className="p-2 border">{r.tanggal}</td>
                      <td className="p-2 border">{r.nomorSP}</td>
                      <td className="p-2 border">{r.jenis}</td>
                      <td className="p-2 border">{r.ringkasan}</td>
                      <td className="p-2 border">
                        <button onClick={()=> restoreFromRow(r)} className="px-2 py-1 border rounded-lg text-xs">Pulihkan</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
