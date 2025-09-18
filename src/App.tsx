import React, { useEffect, useMemo, useState } from "react";

/* ---------- UI ---------- */
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

/* ---------- Helper ---------- */
function dedup(list: any[]) {
  const s: Record<string, boolean> = {};
  const out: any[] = [];
  for (let i = 0; i < (list || []).length; i++) {
    const v = String(list[i] || "").trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (!s[k]) {
      s[k] = true;
      out.push(v);
    }
  }
  return out;
}

/* ================================================================== */
export default function App() {
  /* ---- CSS Print + Layar ---- */
  const PrintCSS = (
    <style>{`
      @page { size: A4 portrait; margin: 12mm; }
      @media print {
        html, body { visibility: hidden !important; }
        #po-print, #po-print * { visibility: visible !important; }
        #po-print { position: absolute; inset: 0; margin: 0 auto; width: 186mm; box-shadow: none; }
        #po-print table { border-collapse: collapse !important; }
        #po-print th, #po-print td { border: 1px solid #000 !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
  );
  const ScreenCSS = (
    <style>{`
      .print-page { width: 186mm; margin: 0 auto; }
      .print-page table { table-layout: fixed; width: 100%; }
      .print-page th, .print-page td { word-break: break-word; }
    `}</style>
  );

  /* ---- Flag ---- */
  const hasSheets = true;

  /* ---- State Utama ---- */
  const [poType, setPoType] = useState("Prekursor"); // Reguler | Prekursor | Obat-obat tertentu
  const [spAuto, setSpAuto] = useState(true);
  const [showMeta, setShowMeta] = useState(false);

  const [header, setHeader] = useState<any>({
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
    ttdScale: 1,
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

  const [tanggalTempat] = useState({
    tempat: "Sleman",
    tanggal: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
  });

  const [items, setItems] = useState<any[]>([
    { nama: "", zatAktif: "", bentukKekuatan: "", satuan: "", jumlah: "", ket: "" },
  ]);

  /* ---- Nomor SP ---- */
  function typeCode(t: string) {
    const s = String(t || "").toLowerCase();
    if (s.indexOf("pre") === 0) return "PRE";
    if (s.indexOf("obat") === 0) return "OOT";
    return "REG";
  }
  function makeSpNumber(seq: number, d?: Date) {
    const dd = d || new Date();
    const mm = String(dd.getMonth() + 1).padStart(2, "0");
    const yyyy = dd.getFullYear();
    const nnn = String(seq || 1).padStart(3, "0");
    return `${nnn}/SP/${typeCode(poType)}/${mm}/${yyyy}`;
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
    } catch { return 1; }
  }
  function writeSeq(n: number, d?: Date) { try { localStorage.setItem(getSpKey(d), String(n)); } catch {} }
  useEffect(() => {
    if (spAuto) {
      const seq = readSeq();
      setHeader((h:any) => ({ ...h, nomorSP: makeSpNumber(seq) }));
    }
  }, [spAuto, poType]);
  function incrementSp() {
    const now = new Date(); const cur = readSeq(now); const nxt = cur + 1;
    writeSeq(nxt, now);
    setHeader((h:any) => ({ ...h, nomorSP: makeSpNumber(nxt, now) }));
  }
  function decrementSp() {
    const now = new Date(); const cur = readSeq(now); const nxt = Math.max(1, cur - 1);
    writeSeq(nxt, now);
    setHeader((h:any) => ({ ...h, nomorSP: makeSpNumber(nxt, now) }));
  }

  /* ---- Zat Aktif (lokal) ---- */
  const DEFAULT_PREKURSOR = [
    "Pseudoefedrin","Efedrin","Norefedrin","Ergometrin","Ergotamin","Anhidrida Asetat","Kalium Permanganat","Phenylpropanolamine HCl"
  ];
  const DEFAULT_OOT = ["Tramadol","Triheksifenidil","Dextromethorphan","Klonazepam","Clobazam"];

  const [preList, setPreList] = useState<string[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem("zat-pre-list") || "null");
      if (Array.isArray(v) && v.length) return dedup(v);
    } catch {}
    return dedup(DEFAULT_PREKURSOR);
  });
  const [ootList, setOotList] = useState<string[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem("zat-oot-list") || "null");
      if (Array.isArray(v) && v.length) return dedup(v);
    } catch {}
    return dedup(DEFAULT_OOT);
  });
  useEffect(() => { try { localStorage.setItem("zat-pre-list", JSON.stringify(preList)); } catch {} }, [preList]);
  useEffect(() => { try { localStorage.setItem("zat-oot-list", JSON.stringify(ootList)); } catch {} }, [ootList]);

  const optionsZatAktif = useMemo(() => {
    if (poType === "Prekursor") return preList;
    if (poType === "Obat-obat tertentu") return ootList;
    return [];
  }, [poType, preList, ootList]);
  const zatOptions = useMemo(() => {
    const base = [{ value: "", label: "-- Pilih Zat Aktif --" }];
    (optionsZatAktif || []).forEach((x) => (base as any).push({ value: String(x), label: String(x) }));
    return base;
  }, [optionsZatAktif]);

  /* ---- Master Item (lokal) ---- */
  type MasterItem = { nama: string; zatAktif?: string; bentukKekuatan?: string; satuan?: string };
  const [masterItems, setMasterItems] = useState<MasterItem[]>(() => {
    try { const v = JSON.parse(localStorage.getItem("master-items") || "null"); return Array.isArray(v) ? v : []; }
    catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem("master-items", JSON.stringify(masterItems)); } catch {} }, [masterItems]);

  const [masterOpen, setMasterOpen] = useState(false);
  const [mNama, setMNama] = useState("");
  const [mZat, setMZat] = useState("");
  const [mForm, setMForm] = useState("");
  const [mSat, setMSat] = useState("");

  function addMaster() {
    const nama = (mNama || "").trim();
    if (!nama) return;
    setMasterItems(prev => prev.concat([{ nama, zatAktif: mZat.trim(), bentukKekuatan: mForm.trim(), satuan: mSat.trim() }]));
    setMNama(""); setMZat(""); setMForm(""); setMSat("");
  }
  function delMaster(i:number){ setMasterItems(prev => prev.filter((_,idx)=> idx!==i)); }
  function updMaster(i:number, field:keyof MasterItem, val:string){
    setMasterItems(prev => { const c=prev.slice(); if(!c[i]) return prev; (c[i] as any)[field]=val; return c; });
  }
  const masterOptions = useMemo(() => {
    const base = [{ value: "", label: "-- Dari Master (Nama + Zat) --" }];
    masterItems.forEach((it, i) => {
      const lab = `${it.nama}${it.zatAktif ? " — " + it.zatAktif : ""}`;
      (base as any).push({ value: String(i), label: lab });
    });
    return base;
  }, [masterItems]);
  function applyMasterToRow(masterIndexStr:string, rowIndex:number){
    if (!masterIndexStr) return;
    const idx = parseInt(masterIndexStr, 10);
    const src = masterItems[idx];
    if (!src) return;
    setItems(prev => prev.map((r,i)=> i===rowIndex
      ? { ...r,
          nama: src.nama || r.nama,
          zatAktif: src.zatAktif || r.zatAktif,
          bentukKekuatan: src.bentukKekuatan || r.bentukKekuatan,
          satuan: src.satuan || r.satuan
        }
      : r));
  }

  /* ---- Items CRUD ---- */
  function addRow(){ setItems(prev => prev.concat([{ nama: "", zatAktif: "", bentukKekuatan: "", satuan: "", jumlah: "", ket: "" }])); }
  function delRow(idx:number){ setItems(prev => prev.filter((_,i)=> i!==idx)); }
  function handleItemChange(idx:number, key:string, value:any){ setItems(prev => prev.map((it,i)=> i===idx ? ({ ...it, [key]: value }) : it)); }
  const showZatAktif = poType !== "Reguler";

  /* ---- Sheets: Riwayat & Simpan ---- */
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
      if (!res.ok) throw new Error(data?.error || "Gagal memuat");
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
        if (parsed.tanggalTempat) {/* optional */ }
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

  /* ---- Zat Aktif <-> Google Sheets ---- */
  const [zOpen, setZOpen] = useState(false);
  const [preNew, setPreNew] = useState("");
  const [ootNew, setOotNew] = useState("");

  async function pullZatFromSheets(kind:"pre"|"oot"){
    try{
      const r = await fetch(`/.netlify/functions/zat-master?action=pull&type=${kind}`);
      const txt = await r.text();
      // Antisipasi error 404/HTML
      const data = JSON.parse(txt);
      if (!r.ok) throw new Error(data?.error || "Gagal tarik");
      const arr = Array.isArray(data?.list) ? data.list : [];
      if (kind === "pre") setPreList(dedup(arr));
      else setOotList(dedup(arr));
      alert(`Berhasil tarik Zat_${kind === "pre" ? "Pre" : "OOT"} dari Google Sheets`);
    }catch(e:any){
      alert("Gagal tarik: " + (e?.message || String(e)));
    }
  }
  async function pushZatToSheets(){
    try{
      const r = await fetch(`/.netlify/functions/zat-master`,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ pre: preList, oot: ootList })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Gagal simpan");
      alert("Berhasil kirim daftar Zat Aktif ke Google Sheets");
    }catch(e:any){
      alert("Gagal kirim: " + (e?.message || String(e)));
    }
  }

  function addPre(){ const v=preNew.trim(); if(!v) return; setPreList(p => dedup(p.concat([v]))); setPreNew(""); }
  function addOOT(){ const v=ootNew.trim(); if(!v) return; setOotList(p => dedup(p.concat([v]))); setOotNew(""); }
  function delPre(i:number){ setPreList(p => p.filter((_,idx)=> idx!==i)); }
  function delOOT(i:number){ setOotList(p => p.filter((_,idx)=> idx!==i)); }
  function renamePre(i:number, val:string){ setPreList(p => { const c=p.slice(); c[i]=val; return dedup(c); }); }
  function renameOOT(i:number, val:string){ setOotList(p => { const c=p.slice(); c[i]=val; return dedup(c); }); }
  function resetZat(){ if (confirm("Kembalikan daftar ke bawaan?")) { setPreList(dedup(DEFAULT_PREKURSOR)); setOotList(dedup(DEFAULT_OOT)); } }

  /* ---- Cetak/Baru ---- */
  const printDoc = () => { window.print(); };
  function newPO(){
    setPbf({ nama: "", alamat: "", telp: "" });
    setItems([{ nama: "", zatAktif: "", bentukKekuatan: "", satuan: "", jumlah: "", ket: "" }]);
    if (spAuto) incrementSp();
  }

  const line = useMemo(() => <div className="w-full h-px bg-gray-400 my-2" />, []);

  /* ============================ UI ============================ */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {PrintCSS}{ScreenCSS}

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 border-b bg-white/80 backdrop-blur px-4 py-3 flex items-center gap-2">
        <h1 className="text-lg font-semibold">PO Builder</h1>
        <div className="ml-auto flex gap-2">
          <button onClick={newPO} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">PO Baru</button>
          <button onClick={addRow} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Tambah Baris</button>
          <button onClick={()=> setMasterOpen(true)} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Kelola Master Item</button>
          <button onClick={()=> setZOpen(true)} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Kelola Zat Aktif</button>
          <button onClick={()=> { setHistoryOpen(true); loadHistory(); }} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Riwayat</button>
          {hasSheets && (<button onClick={saveToGoogleSheets} className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50">Simpan ke Google Sheets</button>)}
          <button onClick={printDoc} className="px-3 py-2 rounded-xl shadow text-sm bg-black text-white hover:opacity-90">Cetak / Simpan PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
        {/* ===== FORM ===== */}
        <section className="space-y-6">
          <Card title="Jenis Purchase Order">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select label="Jenis PO" value={poType} onChange={setPoType} options={["Reguler","Prekursor","Obat-obat tertentu"]} />
            </div>
          </Card>

          <Card title="Nomor SP & Status">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <Input label="Nomor SP" value={header.nomorSP} onChange={(v:string)=> setHeader((h:any)=> ({...h, nomorSP:v}))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={spAuto} onChange={(e)=> setSpAuto((e.target as HTMLInputElement).checked)} />
                Nomor SP otomatis (per jenis)
              </label>
              <div className="flex gap-2">
                <button onClick={decrementSp} className="px-3 py-2 rounded-xl border text-sm">Turunkan</button>
                <button onClick={incrementSp} className="px-3 py-2 rounded-xl border text-sm">Naikkan</button>
              </div>
            </div>
          </Card>

          <Card title="Mengajukan pesanan obat kepada">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Nama PBF" value={pbf.nama} onChange={(v:string)=> setPbf(p=> ({...p, nama:v}))} />
              <Input label="Telepon" value={pbf.telp} onChange={(v:string)=> setPbf(p=> ({...p, telp:v}))} />
              <Input label="Alamat" className="md:col-span-2" value={pbf.alamat} onChange={(v:string)=> setPbf(p=> ({...p, alamat:v}))} />
            </div>
          </Card>

          <Card title="Daftar Item">
            <div className="space-y-4">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-4">
                    <Input label={`Nama Obat #${idx+1}`} placeholder="Nama Obat" value={it.nama} onChange={(v:string)=> handleItemChange(idx, 'nama', v)} />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Select
                      label="Dari Master (opsional)"
                      value={""}
                      onChange={(v:string)=> applyMasterToRow(v, idx)}
                      options={masterOptions}
                    />
                  </div>
                  {showZatAktif && (
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
                    <Input label="Jumlah" value={String(it.jumlah || '')} onChange={(v:string)=> handleItemChange(idx, 'jumlah', v)} />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Input label="Ket" value={it.ket} onChange={(v:string)=> handleItemChange(idx, 'ket', v)} />
                  </div>
                  <div className="col-span-12 flex justify-end gap-2">
                    <button onClick={addRow} className="text-xs px-2 py-1 border rounded-lg">Tambah</button>
                    {items.length > 1 && (
                      <button onClick={()=> delRow(idx)} className="text-xs px-2 py-1 border rounded-lg">Hapus</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ===== PREVIEW ===== */}
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
                <div className="text-xl font-bold tracking-wide">{poType.toUpperCase()}</div>
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

            {/* TABEL (anti terpotong) */}
            <div className="mt-4">
              <div className="-mx-2 px-2 overflow-x-auto">
                <table className="w-full text-xs border border-black table-fixed">
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
            </div>

            {netStatus && <p className="mt-4 text-xs text-gray-600">{netStatus}</p>}
          </div>
        </section>
      </div>

      {/* ========= Panel Zat Aktif ========= */}
      {zOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={()=> setZOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">Kelola Zat Aktif</h3>
              <div className="ml-auto flex gap-2">
                <button onClick={()=> pullZatFromSheets("pre")} className="px-3 py-2 border rounded-lg text-sm">Tarik Pre dari Sheets</button>
                <button onClick={()=> pullZatFromSheets("oot")} className="px-3 py-2 border rounded-lg text-sm">Tarik OOT dari Sheets</button>
                <button onClick={pushZatToSheets} className="px-3 py-2 border rounded-lg text-sm">Kirim ke Sheets</button>
                <button onClick={resetZat} className="px-3 py-2 border rounded-lg text-sm">Reset Default</button>
                <button onClick={()=> setZOpen(false)} className="px-3 py-2 border rounded-lg text-sm">Tutup</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Prekursor</h4>
                <div className="flex gap-2 mb-3">
                  <input value={preNew} onChange={(e)=> setPreNew((e.target as HTMLInputElement).value)} placeholder="Tambah zat aktif..." className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                  <button onClick={addPre} className="px-3 py-2 border rounded-lg text-sm">Tambah</button>
                </div>
                <div className="space-y-2">
                  {preList.map((v,i)=> (
                    <div key={i} className="flex items-center gap-2">
                      <input value={v} onChange={(e)=> renamePre(i, (e.target as HTMLInputElement).value)} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                      <button onClick={()=> delPre(i)} className="px-2 py-2 border rounded-lg text-xs">Hapus</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Obat-obat Tertentu (OOT)</h4>
                <div className="flex gap-2 mb-3">
                  <input value={ootNew} onChange={(e)=> setOotNew((e.target as HTMLInputElement).value)} placeholder="Tambah zat aktif..." className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                  <button onClick={addOOT} className="px-3 py-2 border rounded-lg text-sm">Tambah</button>
                </div>
                <div className="space-y-2">
                  {ootList.map((v,i)=> (
                    <div key={i} className="flex items-center gap-2">
                      <input value={v} onChange={(e)=> renameOOT(i, (e.target as HTMLInputElement).value)} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                      <button onClick={()=> delOOT(i)} className="px-2 py-2 border rounded-lg text-xs">Hapus</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-6 text-xs text-gray-500">Catatan: tombol “Tarik/Kirim” mengakses fungsi Netlify <code>zat-master</code>. Pastikan fungsi itu aktif dan tab Sheets: <b>Zat_Pre</b> &amp; <b>Zat_OOT</b> ada.</p>
          </div>
        </div>
      )}

      {/* ========= Panel Master Item ========= */}
      {masterOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={()=> setMasterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">Kelola Master Item</h3>
              <div className="ml-auto">
                <button onClick={()=> setMasterOpen(false)} className="px-3 py-2 border rounded-lg text-sm">Tutup</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
              <Input label="Nama" value={mNama} onChange={setMNama} />
              <Input label="Zat Aktif" value={mZat} onChange={setMZat} />
              <Input label="Bentuk & Kekuatan" value={mForm} onChange={setMForm} />
              <div className="flex gap-2 items-end">
                <Input label="Satuan" value={mSat} onChange={setMSat} className="w-full" />
                <button onClick={addMaster} className="h-10 px-3 py-2 border rounded-lg text-sm">Tambah</button>
              </div>
            </div>
            <div className="space-y-2">
              {masterItems.length === 0 && <div className="text-sm text-gray-600">Belum ada master.</div>}
              {masterItems.map((m,i)=> (
                <div key={i} className="border rounded-xl p-3 grid grid-cols-1 md:grid-cols-5 gap-2 items-end text-sm">
                  <Input label="Nama" value={m.nama} onChange={(v:string)=> updMaster(i,'nama',v)} />
                  <Input label="Zat Aktif" value={m.zatAktif||""} onChange={(v:string)=> updMaster(i,'zatAktif',v)} />
                  <Input label="Bentuk & Kekuatan" value={m.bentukKekuatan||""} onChange={(v:string)=> updMaster(i,'bentukKekuatan',v)} />
                  <Input label="Satuan" value={m.satuan||""} onChange={(v:string)=> updMaster(i,'satuan',v)} />
                  <div className="flex justify-end">
                    <button onClick={()=> delMaster(i)} className="px-2 py-1 border rounded-lg text-xs">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500">Master Item ini lokal (tersimpan di perangkat).</p>
          </div>
        </div>
      )}

      {/* ========= Riwayat ========= */}
      {historyOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={()=> setHistoryOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">Riwayat (Google Sheets)</h3>
              <div className="ml-auto">
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
