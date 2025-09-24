
import React, { useEffect, useMemo, useState } from "react";

/** ============== UI PRIMITIVES ============== */
function Card({ title, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs text-gray-500">i</span>
        <h3 className="font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function Kbd({ k }: { k: string }) {
  return <kbd className="px-1.5 py-0.5 text-[11px] rounded border bg-gray-50">{k}</kbd>;
}
function Pill({ children, tone = "gray" as any }: any) {
  const map: any = {
    gray: ["bg-gray-100", "text-gray-700"],
    blue: ["bg-blue-100", "text-blue-700"],
    emerald: ["bg-emerald-100", "text-emerald-700"],
    red: ["bg-red-100", "text-red-700"],
  };
  const cls = (map[tone] || map.gray).join(" ");
  return <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] " + cls}>{children}</span>;
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

/** ============== COMBINED CARD ============== */
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

/** ============== APP (DEFAULT EXPORT) ============== */
export default function App() {
  /** ====== PRINT CSS (A4) ====== */
  const PrintCSS = (
    <style>{`
    @page { size: A4 portrait; margin: 12mm; }
    @media print {
      html, body { visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
      #po-print, #po-print * { visibility: visible !important; }
      #po-print {
        position: static !important;
        margin: 0 auto !important;
        width: 186mm !important;
        padding: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
        page-break-after: auto !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        overflow: visible !important;
      }
      #po-print table { border-collapse: collapse !important; page-break-inside: auto !important; table-layout: fixed !important; width: 100% !important; }
      #po-print thead { display: table-header-group !important; }
      #po-print tfoot { display: table-footer-group !important; }
      #po-print th, #po-print td { border: 1px solid #000 !important; word-break: break-word !important; }
      #po-print tr { break-inside: avoid-page !important; page-break-inside: avoid !important; }
      #po-print .print-keep { break-inside: avoid-page !important; page-break-inside: avoid !important; page-break-after: avoid !important; }
      .no-print, [data-fab], .floating, .fixed { display: none !important; }
    }
  `}</style>
  );
  const ScreenCSS = (
    <style>{`
@media screen {
  #po-print tbody tr:nth-child(odd){ background-color: rgba(249,250,251,.5); }
  #po-print tbody tr:hover{ background-color: rgba(249,250,251,1); }
  #po-print thead { position: sticky; top: 0; background: white; z-index: 1; }
  .page-guide { background-image: linear-gradient(to bottom, transparent 0, transparent 296mm, rgba(0,0,0,.06) 296mm, rgba(0,0,0,.06) 297mm); background-size: 100% 297mm; }
}
    `}</style>
  );

  /** ====== FLAGS ====== */
  const hasSheets = true;

  /** ====== STATE ====== */
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

  const [tanggalTempat] = useState({
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

  /** ====== ZAT AKTIF (lokal) ====== */
  const DEFAULT_PREKURSOR = [
    "Pseudoefedrin","Efedrin","Norefedrin","Ergometrin","Ergotamin","Anhidrida Asetat","Kalium Permanganat","Phenylpropanolamine HCl"
  ];
  const DEFAULT_OOT = ["Tramadol","Triheksifenidil","Dextromethorphan","Klonazepam","Clobazam"];
  function dedup(list: any[]) { const s: Record<string, boolean> = {}; const out: any[] = []; for (let i=0;i<(list||[]).length;i++){ const v=String(list[i]||"").trim(); if(!v) continue; const k=v.toLowerCase(); if(!s[k]){ s[k]=true; out.push(v); } } return out; }
  const [preList, setPreList] = useState<string[]>(() => { try { const v=JSON.parse(localStorage.getItem("zat-pre-list")||"null"); if (Array.isArray(v) && v.length) return dedup(v);} catch{} return dedup(DEFAULT_PREKURSOR); });
  const [ootList, setOotList] = useState<string[]>(() => { try { const v=JSON.parse(localStorage.getItem("zat-oot-list")||"null"); if (Array.isArray(v) && v.length) return dedup(v);} catch{} return dedup(DEFAULT_OOT); });
  useEffect(() => { try { localStorage.setItem("zat-pre-list", JSON.stringify(preList)); } catch{} }, [preList]);
  useEffect(() => { try { localStorage.setItem("zat-oot-list", JSON.stringify(ootList)); } catch{} }, [ootList]);

  /** ====== MASTER ZAT (via Netlify Function) ====== */
  type MasterItem = { nama_obat: string; zat_aktif: string; bentuk_kekuatan?: string; satuan?: string; };
  const [preMaster, setPreMaster] = useState<MasterItem[]>(() => { try { const v=JSON.parse(localStorage.getItem("master-pre")||"null"); if(Array.isArray(v)) return v; } catch{} return []; });
  const [ootMaster, setOotMaster] = useState<MasterItem[]>(() => { try { const v=JSON.parse(localStorage.getItem("master-oot")||"null"); if(Array.isArray(v)) return v; } catch{} return []; });
  useEffect(()=>{ try { localStorage.setItem("master-pre", JSON.stringify(preMaster)); } catch{} }, [preMaster]);
  useEffect(()=>{ try { localStorage.setItem("master-oot", JSON.stringify(ootMaster)); } catch{} }, [ootMaster]);

  async function pullMaster(type:'pre'|'oot'){
    try{
      const r = await fetch(`/.netlify/functions/zat-master?action=pull&type=${type}`);
      const data = await r.json();
      if(!r.ok) throw new Error(data?.error || "Gagal tarik master");
      const rows: MasterItem[] = Array.isArray(data?.items) ? data.items : [];
      if(type==='pre') setPreMaster(rows); else setOotMaster(rows);
      alert(`Berhasil tarik Master ${type==='pre'?'Prekursor':'OOT'} dari Google Sheets (${rows.length} baris).`);
    }catch(e:any){ alert("Gagal tarik: " + (e?.message || String(e))); }
  }

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

  // Opsi "Dari Master" untuk baris item
  const masterOptions = useMemo(() => {
    const base = [{ value: "", label: "-- Dari Master (Nama + Zat) --" }];
    const source = poType === "Prekursor" ? preMaster : poType === "Obat-obat tertentu" ? ootMaster : [];
    for (let i=0;i<source.length;i++){
      const m = source[i] || ({} as MasterItem);
      const lab = [m.nama_obat || "-", m.zat_aktif ? `— ${m.zat_aktif}` : ""].join(" ").trim();
      (base as any).push({ value: String(i), label: lab });
    }
    return base;
  }, [poType, preMaster, ootMaster]);

  function applyMasterToRow(rowIndex:number, idxStr:string){
    const idx = parseInt(idxStr, 10);
    if(isNaN(idx)) return;
    const srcM = poType === "Prekursor" ? preMaster : poType === "Obat-obat tertentu" ? ootMaster : [];
    const m = srcM[idx];
    if(!m) return;
    setItems(prev => prev.map((it,i)=> i!==rowIndex ? it : {
      ...it,
      nama: m.nama_obat || it.nama || "",
      zatAktif: m.zat_aktif || it.zatAktif || "",
      bentukKekuatan: m.bentuk_kekuatan ?? it.bentukKekuatan ?? "",
      satuan: m.satuan ?? it.satuan ?? "",
    }));
  }

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
  function assemblePayload(){ return { poType, header, pemesan, pbf, kebutuhan, items, savedAt: new Date().toISOString() }; }
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

  /** ====== CETAK ====== */
  const printDoc = () => {
    try {
      markSpUsedLocal(header.nomorSP);
      const srcEl = document.getElementById('po-print');
      if (!srcEl) { window.print(); return; }
      const clone = srcEl.cloneNode(true) as HTMLElement;
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {PrintCSS}
      {ScreenCSS}

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 border-b bg-white/80 backdrop-blur px-4 py-3 flex items-center gap-2 flex-wrap">
        <h1 className="text-lg font-semibold">Purchase Order – Builder (Lengkap)</h1>
        <div className="ml-auto flex gap-2 flex-wrap">
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

          {/* === GABUNGAN: Jenis PO + Nomor SP === */}
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

          {/* Tujuan PBF */}
          <Card title="Mengajukan pesanan obat kepada">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-2">
              <Input label="Nama PBF" value={pbf.nama} onChange={(v:string)=> setPbf({...pbf, nama:v})} />
              <Input label="Telepon" value={pbf.telp} onChange={(v:string)=> setPbf({...pbf, telp:v})} />
              <Input label="Alamat" className="md:col-span-1" value={pbf.alamat} onChange={(v:string)=> setPbf({...pbf, alamat:v})} />
            </div>
          </Card>

          {/* Daftar Item */}
          <Card title="Daftar Item">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600">Kelola item</div>
              <div className="flex gap-2">
                <button onClick={()=> setFavOpen(true)} className="text-xs px-2 py-1 border rounded-lg">Tambah dari Favorit</button>
                <button onClick={addRow} className="text-xs px-2 py-1 border rounded-lg">Tambah Baris</button>
                <button onClick={()=> setZOpen(true)} className="text-xs px-2 py-1 border rounded-lg">Kelola Zat Aktif</button>
              </div>
            </div>
            <div className="space-y-4">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-4">
                    <Input label={`Nama Obat #${idx+1}`} placeholder="Nama Obat" value={it.nama} onChange={(v:string)=> handleItemChange(idx, 'nama', v)} />
                  </div>

                  {poType !== "Reguler" && (
                    <div className="col-span-12 md:col-span-3">
                      <Select
                        label="Dari Master (opsional)"
                        value={""}
                        onChange={(v:string)=> applyMasterToRow(idx, v)}
                        options={masterOptions}
                      />
                    </div>
                  )}

                  {poType !== "Reguler" && (
                    <div className="col-span-6 md:col-span-2">
                      <Select label="Zat Aktif" value={it.zatAktif || ''} onChange={(v:string)=> handleItemChange(idx, 'zatAktif', v)} options={zatOptions} />
                    </div>
                  )}
                  <div className="col-span-6 md:col-span-2">
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
        <section className="page-guide">
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
                    {poType !== "Reguler" && <th className="p-2 border border-black">Zat Aktif</th>}
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
                      {poType !== "Reguler" && <td className="p-2 border border-black text-left">{it.zatAktif || ''}</td>}
                      <td className="p-2 border border-black text-left">{it.bentukKekuatan || ''}</td>
                      <td className="p-2 border border-black text-center">{it.satuan || ''}</td>
                      <td className="p-2 border border-black text-center">{String(it.jumlah || '')}</td>
                      <td className="p-2 border border-black text-left">{it.ket || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {netStatus && <p className="mt-4 text-xs text-gray-600">{netStatus}</p>}
            <p className="mt-2 text-[11px] text-gray-500">
              Dibuat: {new Date().toLocaleString("id-ID")} · Operator: {typeof window!=="undefined" ? (localStorage.getItem("operatorName")||"-") : "-"}
            </p>
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
                <button onClick={()=> pullMaster('pre')} className="px-3 py-2 border rounded-lg text-sm">Tarik Prekursor dari Sheets</button>
                <button onClick={()=> pullMaster('oot')} className="px-3 py-2 border rounded-lg text-sm">Tarik OOT dari Sheets</button>
                <button onClick={resetZat} className="px-3 py-2 border rounded-lg text-sm">Reset daftar lokal</button>
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

                {/* preview master */}
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1">Master Prekursor dari Sheets ({preMaster.length})</div>
                  <div className="max-h-40 overflow-auto text-xs border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-1 border">Nama</th>
                          <th className="p-1 border">Zat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preMaster.map((m,i)=>(
                          <tr key={i}>
                            <td className="p-1 border">{m.nama_obat}</td>
                            <td className="p-1 border">{m.zat_aktif}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

                {/* preview master */}
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1">Master OOT dari Sheets ({ootMaster.length})</div>
                  <div className="max-h-40 overflow-auto text-xs border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-1 border">Nama</th>
                          <th className="p-1 border">Zat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ootMaster.map((m,i)=>(
                          <tr key={i}>
                            <td className="p-1 border">{m.nama_obat}</td>
                            <td className="p-1 border">{m.zat_aktif}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
            <p className="mt-6 text-xs text-gray-500">Master dikelola di Google Sheets tab <b>Zat_Pre</b> & <b>Zat_OOT</b>. Klik tombol “Tarik … dari Sheets” untuk memperbarui.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((r:any) => (
                    <tr key={r.idx}>
                      <td className="p-2 border">{r.tanggal}</td>
                      <td className="p-2 border">{r.nomorSP}</td>
                      <td className="p-2 border">{r.jenis}</td>
                      <td className="p-2 border">{r.ringkasan}</td>
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
