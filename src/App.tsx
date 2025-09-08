// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** =======================================================================
 *  UI PRIMITIVES
 *  ======================================================================= */
function Card({ title, children, className = "" }: any) {
  return (
    <div className={"bg-white rounded-2xl shadow p-4 " + className}>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
            i
          </span>
          <h3 className="font-semibold">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
function Input({
  label,
  value,
  onChange,
  className = "",
  type = "text",
  placeholder = "",
}: any) {
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

/** =======================================================================
 *  APP
 *  ======================================================================= */
export default function App() {
  /** -------------------- PRINT CSS (A4, clone-only) -------------------- */
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
          break-inside: avoid;
          page-break-inside: avoid;
        }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
  );

  /** -------------------- FLAGS / CONSTANTS -------------------- */
  const hasSheets = true; // aktifkan tombol Sheets
  const hasDrive = true; // aktifkan upload Drive
  const MAX_AUTO_RETRY = 30; // batas safety saat auto-bump nomor SP

  /** -------------------- STATE UTAMA -------------------- */
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

    // ===== TTD (gambar/scan) =====
    ttdUrl: "https://iili.io/KBb62lS.png",
    ttdHeightMm: 50, // batas tinggi gambar
    ttdAreaHeightMm: 18, // jarak tetap Pemesan ↔ Nama
    ttdX: 171, // posisi default
    ttdY: 43,
    ttdScale: 1,
  });

  const [pemesan, setPemesan] = useState({
    nama: "apt. Bayu Bakti Angga S, M. Pharm. Sci.",
    jabatan: "Apoteker Penanggung Jawab",
    sipa:
      "503/11388-23042025-KES/11388-23042025-20250430/SIPA/2025",
  });

  const [pbf, setPbf] = useState({ nama: "", alamat: "", telp: "" });
  const [kebutuhan, setKebutuhan] = useState({
    namaKlinik: "Klinik Bangun Husada",
    alamat:
      "Jl. Perumnas 207 Gorongan, Condongcatur, Depok, Sleman",
    noIzin: "503/4736/83/DKS/2021",
  });
  const [tanggalTempat, setTanggalTempat] = useState({
    tempat: "Sleman",
    tanggal: new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  });
  const [items, setItems] = useState<any[]>([
    {
      nama: "",
      zatAktif: "",
      bentukKekuatan: "",
      satuan: "",
      jumlah: "",
      ket: "",
    },
  ]);

  /** -------------------- NOMOR SP / SEQUENCE -------------------- */
  function typeCode(t: string) {
    const s = String(t || "").toLowerCase();
    if (s.startsWith("pre")) return "PRE";
    if (s.startsWith("obat")) return "OOT";
    return "REG";
  }
  function typeUpper(t: string) {
    const s = String(t || "").toLowerCase();
    if (s.startsWith("pre")) return "PREKURSOR";
    if (s.startsWith("obat")) return "OBAT-OBAT TERTENTU";
    return "REGULER";
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
    return `sp-seq-${typeCode(poType)}-${y}${m}`;
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
  function writeSeq(n: number, d?: Date) {
    try {
      localStorage.setItem(getSpKey(d), String(n));
    } catch {}
  }
  useEffect(() => {
    if (spAuto) {
      const seq = readSeq();
      setHeader((h: any) => ({ ...h, nomorSP: makeSpNumber(seq) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spAuto, poType]);

  function incrementSp() {
    const now = new Date();
    const cur = readSeq(now);
    const next = cur + 1;
    writeSeq(next, now);
    setHeader((h: any) => ({ ...h, nomorSP: makeSpNumber(next, now) }));
  }
  function decrementSp() {
    const now = new Date();
    const cur = readSeq(now);
    const next = Math.max(1, cur - 1);
    writeSeq(next, now);
    setHeader((h: any) => ({ ...h, nomorSP: makeSpNumber(next, now) }));
  }

  /** -------------------- CEK UNIK (LOKAL & SHEETS) -------------------- */
  function loadUsedSpLocal() {
    try {
      const v = JSON.parse(
        localStorage.getItem("sp-used-local") || "[]"
      );
      return Array.isArray(v) ? new Set(v) : new Set();
    } catch {
      return new Set();
    }
  }
  function saveUsedSpLocal(setv: Set<string>) {
    try {
      localStorage.setItem(
        "sp-used-local",
        JSON.stringify(Array.from(setv))
      );
    } catch {}
  }
  const usedLocalSet = useMemo(() => loadUsedSpLocal(), [header.nomorSP]);
  const isSpUsedLocal = usedLocalSet.has(header.nomorSP || "");
  const [spRemoteStatus, setSpRemoteStatus] = useState("");

  async function checkSpUniqueRemote(num?: string) {
    if (!hasSheets) {
      setSpRemoteStatus("");
      return true;
    }
    try {
      setSpRemoteStatus("Memeriksa...");
      const res = await fetch(
        "/.netlify/functions/sheets-check-unique?num=" +
          encodeURIComponent(num || "")
      );
      const data = await res.json();
      const dup = !!data.duplicate;
      setSpRemoteStatus(dup ? "Duplikat di Sheets" : "Unik di Sheets");
      return !dup;
    } catch (e: any) {
      setSpRemoteStatus("Gagal cek: " + (e.message || String(e)));
      return true; // fallback
    }
  }

  function markSpUsedLocal(num?: string) {
    const s = loadUsedSpLocal();
    if (num) {
      s.add(num);
      saveUsedSpLocal(s);
    }
  }

  /** Auto-bump sampai unik (lokal & remote) */
  async function ensureUniqueSp(): Promise<string> {
    let tries = 0;
    let current = header.nomorSP || "";
    while (tries < MAX_AUTO_RETRY) {
      const dupLocal = loadUsedSpLocal().has(current);
      const uniqRemote = await checkSpUniqueRemote(current);
      const dupRemote = !uniqRemote;

      if (!dupLocal && !dupRemote) {
        return current;
      }
      // bump
      incrementSp();
      current = makeSpNumber(readSeq());
      tries++;
    }
    return current;
  }

  /** -------------------- ITEMS -------------------- */
  function addRow() {
    setItems((prev) =>
      prev.concat([
        {
          nama: "",
          zatAktif: "",
          bentukKekuatan: "",
          satuan: "",
          jumlah: "",
          ket: "",
        },
      ])
    );
  }
  function delRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }
  function handleItemChange(idx: number, key: string, value: any) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
    );
  }
  const showZatAktif = poType !== "Reguler";

  /** -------------------- GOOGLE SHEETS + DRIVE -------------------- */
  const [netStatus, setNetStatus] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  function assemblePayload() {
    return {
      poType,
      header,
      pemesan,
      pbf,
      kebutuhan,
      tanggalTempat,
      items,
      savedAt: new Date().toISOString(),
    };
  }

  async function saveToGoogleSheets() {
    try {
      setNetStatus("Memeriksa nomor SP...");
      const uniqueSp = await ensureUniqueSp();
      if (uniqueSp !== header.nomorSP) {
        setHeader((h: any) => ({ ...h, nomorSP: uniqueSp }));
      }

      setNetStatus("Menyimpan ke Google Sheets...");
      const res = await fetch("/.netlify/functions/sheets-append", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: assemblePayload() }),
      });
      const data = await res.json();
      if (data && data.error) {
        throw new Error(data.error.message || "Gagal menyimpan");
      }

      // tandai lokal terpakai
      markSpUsedLocal(uniqueSp);

      // Generate PDF & upload (opsional)
      if (hasDrive) {
        setNetStatus("Membuat PDF...");
        const blob = await makePdfBlob();
        setNetStatus("Upload PDF ke Google Drive...");
        const fd = new FormData();
        fd.append("file", blob, safePdfName(uniqueSp));
        // bisa juga kirim metadata tambahan
        fd.append("nomorSP", uniqueSp);
        fd.append("poType", poType);

        const up = await fetch("/.netlify/functions/drive-upload", {
          method: "POST",
          body: fd,
        });
        const upRes = await up.json();
        if (upRes && upRes.error) {
          throw new Error(upRes.error.message || "Gagal upload Drive");
        }
        setNetStatus(
          "Tersimpan & PDF ter-upload ✔ (Drive ID: " + (upRes?.id || "-") + ")"
        );
      } else {
        setNetStatus("Tersimpan ke Google Sheets ✔");
      }

      // auto-clear status
      setTimeout(() => setNetStatus(""), 2500);
    } catch (e: any) {
      console.error(e);
      setNetStatus("Gagal: " + (e.message || e.toString()));
    }
  }

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await fetch("/.netlify/functions/sheets-history");
      const data = await res.json();
      if (data && data.error) {
        throw new Error(data.error.message || "Gagal memuat");
      }
      setHistoryRows((data.rows || []) as any[]);
    } catch (e: any) {
      console.error(e);
      setHistoryError(e.message || String(e));
    } finally {
      setHistoryLoading(false);
    }
  }

  function restoreFromRow(row: any) {
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
        alert(
          "Baris ini tidak memiliki data JSON utuh untuk di-restore."
        );
      }
    } catch (e: any) {
      console.error(e);
      alert("Gagal memulihkan data: " + (e.message || e.toString()));
    }
  }

  /** -------------------- PDF MAKER -------------------- */
  function safePdfName(num: string) {
    const safe = (num || "").replace(/[^\w\-./]/g, "_");
    return `SP_${safe}.pdf`;
  }

  async function makePdfBlob(): Promise<Blob> {
    const el = document.getElementById("po-print");
    if (!el) throw new Error("Elemen cetak tidak ditemukan.");

    // snapshot ukuran elemen
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.9);

    // PDF A4 Portrait
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297

    // margin printcss: 12mm kiri & kanan → area lebar 186mm
    const targetWidth = 186;
    const x = (pageWidth - targetWidth) / 2; // center
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;
    const ratio = targetWidth / (imgWidthPx / 96 * 25.4); // px to mm (96dpi → 1in=25.4mm)
    // Sederhana: masukkan gambar lebar targetWidth, skala tinggi proporsional
    const imgH_mm = (imgHeightPx / 96) * 25.4 * ratio;

    pdf.addImage(imgData, "JPEG", x, 12, targetWidth, imgH_mm, undefined, "FAST");

    return pdf.output("blob");
  }

  /** -------------------- CETAK HALAMAN -------------------- */
  const printDoc = () => {
    try {
      const src = document.getElementById("po-print");
      if (!src) {
        window.print();
        return;
      }
      const clone = src.cloneNode(true) as HTMLElement;
      clone.id = "print-clone";
      document.body.appendChild(clone);
      document.body.classList.add("printing");
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove("printing");
          try {
            clone.remove();
          } catch {}
        }, 100);
      }, 50);
    } catch {
      window.print();
    }
  };

  /** -------------------- NEW PO -------------------- */
  function newPO() {
    setPbf({ nama: "", alamat: "", telp: "" });
    setItems([
      {
        nama: "",
        zatAktif: "",
        bentukKekuatan: "",
        satuan: "",
        jumlah: "",
        ket: "",
      },
    ]);
    if (spAuto) incrementSp();
  }

  /** -------------------- DRAG TTD -------------------- */
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    x0: number;
    y0: number;
  } | null>(null);

  function onSigMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      x0: header.ttdX || 0,
      y0: header.ttdY || 0,
    };
  }
  function onSigMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setHeader((h: any) => ({
      ...h,
      ttdX: dragRef.current!.x0 + dx,
      ttdY: dragRef.current!.y0 + dy,
    }));
  }
  function onSigMouseUp() {
    setDragging(false);
    dragRef.current = null;
  }

  /** -------------------- UTIL UI -------------------- */
  const line = useMemo(
    () => <div className="w-full h-px bg-gray-400 my-2" />,
    []
  );

  /** =======================================================================
   *  RENDER
   *  ======================================================================= */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {PrintCSS}

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 border-b bg-white/80 backdrop-blur px-4 py-3 flex items-center gap-2">
        <h1 className="text-lg font-semibold">
          Purchase Order – Builder (Lengkap)
        </h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={newPO}
            className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50"
          >
            PO Baru
          </button>
          <button
            onClick={addRow}
            className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50"
          >
            Tambah Baris
          </button>
          <button
            onClick={() => {
              setHistoryOpen(true);
              loadHistory();
            }}
            className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50"
          >
            Riwayat
          </button>
          {hasSheets && (
            <button
              onClick={saveToGoogleSheets}
              className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50"
            >
              Simpan ke Google Sheets {hasDrive ? "+ Drive" : ""}
            </button>
          )}
          <button
            onClick={printDoc}
            className="px-3 py-2 rounded-xl shadow text-sm bg-black text-white hover:opacity-90"
          >
            Cetak / Simpan PDF
          </button>
          <button
            onClick={() => setShowMeta((v) => !v)}
            className="px-3 py-2 rounded-xl shadow text-sm border hover:bg-gray-50"
          >
            {showMeta ? "Mode Fokus" : "Edit Identitas"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
        {/* ===== FORM ===== */}
        <section className="space-y-6">
          {/* Info mode */}
          <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-3 py-2">
            <div className="text-sm font-medium">Mode fokus pengisian</div>
            <div className="text-xs">
              Bagian Identitas, Pemesan, dan Kebutuhan Faskes dapat
              disembunyikan agar fokus ke Tujuan PBF & Daftar Item.
            </div>
          </div>

          {/* Jenis PO */}
          <Card title="Jenis Purchase Order">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Jenis PO"
                value={poType}
                onChange={setPoType}
                options={["Reguler", "Prekursor", "Obat-obat tertentu"]}
              />
            </div>
          </Card>

          {/* ===== NOMOR SP (SELALU TAMPIL) di luar mode fokus ===== */}
          <Card title="Nomor Surat Pesanan">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <Input
                label="Nomor SP"
                value={header.nomorSP}
                onChange={(v: string) =>
                  setHeader((h: any) => ({ ...h, nomorSP: v }))
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={spAuto}
                  onChange={(e) =>
                    setSpAuto((e.target as HTMLInputElement).checked)
                  }
                />
                Nomor SP otomatis (per jenis/bulan)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={decrementSp}
                  className="px-3 py-2 rounded-xl border text-sm"
                >
                  Turunkan
                </button>
                <button
                  onClick={incrementSp}
                  className="px-3 py-2 rounded-xl border text-sm"
                >
                  Naikkan
                </button>
              </div>
            </div>

            {/* Status unik – font dibesarkan 1 tingkat (text-base) */}
            <div className="mt-2 text-base text-gray-700">
              Status lokal:{" "}
              {isSpUsedLocal ? (
                <span className="text-red-600 font-medium">Duplikat</span>
              ) : (
                <span className="text-green-700 font-medium">Unik</span>
              )}
              {hasSheets && (
                <>
                  {" "}
                  ·{" "}
                  <button
                    onClick={() => checkSpUniqueRemote(header.nomorSP)}
                    className="underline"
                  >
                    Cek unik ke Sheets
                  </button>
                  {spRemoteStatus && <> — {spRemoteStatus}</>}
                </>
              )}
            </div>
          </Card>

          {/* Identitas Faskes (opsional ditampilkan) */}
          {showMeta && (
            <Card title="Identitas Fasilitas Kesehatan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Judul Dokumen"
                  value={header.judul}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({ ...h, judul: v }))
                  }
                />
                <Input
                  label="Nama Faskes"
                  value={header.namaFaskes}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({ ...h, namaFaskes: v }))
                  }
                />
                <Input
                  label="Izin"
                  value={header.izin}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({ ...h, izin: v }))
                  }
                />
                <Input
                  label="Telp"
                  value={header.telp}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({ ...h, telp: v }))
                  }
                />
                <Input
                  label="Alamat"
                  className="md:col-span-2"
                  value={header.alamat}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({ ...h, alamat: v }))
                  }
                />
                <Input
                  label="Logo URL (opsional)"
                  className="md:col-span-2"
                  value={header.logoUrl}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({ ...h, logoUrl: v }))
                  }
                  placeholder="https://.../logo.png"
                />

                {/* TTD */}
                <Input
                  label="Tanda Tangan URL (opsional)"
                  className="md:col-span-2"
                  value={header.ttdUrl}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({ ...h, ttdUrl: v }))
                  }
                  placeholder="https://.../tanda-tangan.png"
                />
                <Input
                  label="Tinggi maksimal TTD (mm)"
                  value={String(header.ttdHeightMm)}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({
                      ...h,
                      ttdHeightMm: Math.max(
                        10,
                        Math.min(60, parseInt(v || "22", 10) || 22)
                      ),
                    }))
                  }
                  type="number"
                />
                <Input
                  label="Tinggi ruang TTD (mm) — jarak Pemesan ↔ Nama"
                  value={String(header.ttdAreaHeightMm)}
                  onChange={(v: string) =>
                    setHeader((h: any) => ({
                      ...h,
                      ttdAreaHeightMm: Math.max(
                        10,
                        Math.min(60, parseInt(v || "18", 10) || 18)
                      ),
                    }))
                  }
                  type="number"
                />
                <div className="md:col-span-2 grid grid-cols-3 gap-3">
                  <Input
                    label="Posisi X (px)"
                    value={String(header.ttdX)}
                    onChange={(v: string) =>
                      setHeader((h: any) => ({
                        ...h,
                        ttdX: parseInt(v || "0", 10) || 0,
                      }))
                    }
                    type="number"
                  />
                  <Input
                    label="Posisi Y (px)"
                    value={String(header.ttdY)}
                    onChange={(v: string) =>
                      setHeader((h: any) => ({
                        ...h,
                        ttdY: parseInt(v || "0", 10) || 0,
                      }))
                    }
                    type="number"
                  />
                  <label className="block">
                    <span className="text-xs text-gray-600">Scale (%)</span>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={1}
                      value={Math.round((header.ttdScale ?? 1) * 100)}
                      onChange={(e) =>
                        setHeader((h: any) => ({
                          ...h,
                          ttdScale: Math.max(
                            0.5,
                            Math.min(
                              2,
                              Number((e.target as HTMLInputElement).value) /
                                100
                            )
                          ),
                        }))
                      }
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      {Math.round((header.ttdScale ?? 1) * 100)}%
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Pemesan */}
          {showMeta && (
            <Card title="Pemesan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Nama"
                  value={pemesan.nama}
                  onChange={(v: string) =>
                    setPemesan((p) => ({ ...p, nama: v }))
                  }
                />
                <Input
                  label="Jabatan"
                  value={pemesan.jabatan}
                  onChange={(v: string) =>
                    setPemesan((p) => ({ ...p, jabatan: v }))
                  }
                />
                <Input
                  label="Nomor SIPA"
                  className="md:col-span-2"
                  value={pemesan.sipa}
                  onChange={(v: string) =>
                    setPemesan((p) => ({ ...p, sipa: v }))
                  }
                />
              </div>
            </Card>
          )}

          {/* Kebutuhan Faskes */}
          {showMeta && (
            <Card title="Kebutuhan Faskes">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Nama Klinik"
                  value={kebutuhan.namaKlinik}
                  onChange={(v: string) =>
                    setKebutuhan((k) => ({ ...k, namaKlinik: v }))
                  }
                />
                <Input
                  label="No. Izin"
                  value={kebutuhan.noIzin}
                  onChange={(v: string) =>
                    setKebutuhan((k) => ({ ...k, noIzin: v }))
                  }
                />
                <Input
                  label="Alamat"
                  className="md:col-span-2"
                  value={kebutuhan.alamat}
                  onChange={(v: string) =>
                    setKebutuhan((k) => ({ ...k, alamat: v }))
                  }
                />
              </div>
            </Card>
          )}

          {/* Tujuan PBF */}
          <Card title="Mengajukan pesanan obat kepada">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Nama PBF"
                value={pbf.nama}
                onChange={(v: string) => setPbf({ ...pbf, nama: v })}
              />
              <Input
                label="Telepon"
                value={pbf.telp}
                onChange={(v: string) => setPbf({ ...pbf, telp: v })}
              />
              <Input
                label="Alamat"
                className="md:col-span-2"
                value={pbf.alamat}
                onChange={(v: string) => setPbf({ ...pbf, alamat: v })}
              />
            </div>
          </Card>

          {/* Daftar Item */}
          <Card title="Daftar Item">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600">Kelola item</div>
              <div className="flex gap-2">
                <button
                  onClick={addRow}
                  className="text-xs px-2 py-1 border rounded-lg"
                >
                  Tambah Baris
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-end"
                >
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      label={`Nama Obat #${idx + 1}`}
                      placeholder="Nama Obat"
                      value={it.nama}
                      onChange={(v: string) =>
                        handleItemChange(idx, "nama", v)
                      }
                    />
                  </div>
                  {showZatAktif && (
                    <div className="col-span-6 md:col-span-2">
                      <Input
                        label="Zat Aktif"
                        value={it.zatAktif}
                        onChange={(v: string) =>
                          handleItemChange(idx, "zatAktif", v)
                        }
                      />
                    </div>
                  )}
                  <div className="col-span-6 md:col-span-3">
                    <Input
                      label="Bentuk & Kekuatan"
                      value={it.bentukKekuatan}
                      onChange={(v: string) =>
                        handleItemChange(idx, "bentukKekuatan", v)
                      }
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Input
                      label="Satuan"
                      value={it.satuan}
                      onChange={(v: string) =>
                        handleItemChange(idx, "satuan", v)
                      }
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Input
                      label="Jumlah"
                      value={String(it.jumlah || "")}
                      onChange={(v: string) =>
                        handleItemChange(idx, "jumlah", v)
                      }
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Input
                      label="Ket"
                      value={it.ket}
                      onChange={(v: string) =>
                        handleItemChange(idx, "ket", v)
                      }
                    />
                  </div>
                  <div className="col-span-12 flex justify-end gap-2">
                    {items.length > 1 && (
                      <button
                        onClick={() => delRow(idx)}
                        className="text-xs px-2 py-1 border rounded-lg"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ===== PREVIEW / CETAK ===== */}
        <section>
          <div
            id="po-print"
            className="print-page bg-white shadow-sm rounded-2xl p-6"
          >
            {/* KOP */}
            <div className="flex items-start gap-4">
              {header.logoUrl ? (
                <img
                  src={header.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-full object-contain border"
                />
              ) : (
                <div className="shrink-0 w-16 h-16 rounded-full border grid place-items-center text-xs text-gray-500">
                  LOGO
                </div>
              )}
              <div className="grow">
                <h2 className="font-semibold text-xl tracking-wide">
                  {header.namaFaskes}
                </h2>
                <p className="text-sm leading-snug">
                  {header.izin}
                  <br />
                  {header.alamat}
                  <br />
                  {header.telp}
                </p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-extrabold leading-tight">
                  {header.judul || "SURAT PESANAN"}
                </div>
                <div className="text-xl font-bold tracking-wide">
                  {typeUpper(poType)}
                </div>
              </div>
            </div>
            {line}

            <div className="text-center text-sm">
              <div>
                <span className="font-medium">Nomor SP : </span>
                <span>{header.nomorSP}</span>
              </div>
            </div>

            {/* PEMESAN */}
            <div className="mt-4 text-sm space-y-1">
              <p>
                <span className="inline-block w-56">
                  Yang bertanda tangan di bawah ini
                </span>
                :
              </p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2">
                <span>Nama</span>
                <span>: {pemesan.nama}</span>
                <span>Jabatan</span>
                <span>: {pemesan.jabatan}</span>
                <span>Nomor SIPA</span>
                <span>: {pemesan.sipa}</span>
              </div>
            </div>

            {/* TUJUAN */}
            <div className="mt-4 text-sm space-y-1">
              <p>Mengajukan pesanan obat kepada :</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2">
                <span>Nama PBF</span>
                <span>: {pbf.nama}</span>
                <span>Alamat</span>
                <span>: {pbf.alamat}</span>
                <span>Telp.</span>
                <span>: {pbf.telp || "-"}</span>
              </div>
            </div>

            {/* TABEL */}
            <div className="mt-4">
              <table className="w-full text-xs border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-black w-10">No</th>
                    <th className="p-2 border border-black">Nama Obat</th>
                    {showZatAktif && (
                      <th className="p-2 border border-black">Zat Aktif</th>
                    )}
                    <th className="p-2 border border-black">
                      Bentuk dan Kekuatan
                    </th>
                    <th className="p-2 border border-black">Satuan</th>
                    <th className="p-2 border border-black">Jumlah</th>
                    <th className="p-2 border border-black">Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-black text-center">
                        {i + 1}
                      </td>
                      <td className="p-2 border border-black text-left">
                        {it.nama || ""}
                      </td>
                      {showZatAktif && (
                        <td className="p-2 border border-black text-left">
                          {it.zatAktif || ""}
                        </td>
                      )}
                      <td className="p-2 border border-black text-left">
                        {it.bentukKekuatan || ""}
                      </td>
                      <td className="p-2 border border-black text-center">
                        {it.satuan || ""}
                      </td>
                      <td className="p-2 border border-black text-center">
                        {String(it.jumlah || "")}
                      </td>
                      <td className="p-2 border border-black text-left">
                        {it.ket || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* KEBUTUHAN */}
            <div className="mt-4 text-sm space-y-1">
              <p>Obat tersebut akan digunakan untuk memenuhi kebutuhan :</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2">
                <span>Nama Klinik</span>
                <span>: {kebutuhan.namaKlinik}</span>
                <span>Alamat</span>
                <span>: {kebutuhan.alamat}</span>
                <span>No. Izin</span>
                <span>: {kebutuhan.noIzin}</span>
              </div>
            </div>

            {/* TANDA TANGAN */}
            <div className="mt-8 text-sm">
              <div className="flex justify-end">
                <div className="w-80 text-center">
                  <p>
                    {tanggalTempat.tempat}, {tanggalTempat.tanggal}
                  </p>
                  <p>Pemesan</p>

                  {header.ttdUrl ? (
                    <div
                      className={`${dragging ? "select-none" : ""}`}
                      style={{
                        position: "relative",
                        height: `${header.ttdAreaHeightMm}mm`, // spacer tetap
                        overflow: "visible",
                      }}
                      onMouseMove={onSigMouseMove}
                      onMouseUp={onSigMouseUp}
                      onMouseLeave={onSigMouseUp}
                      title="Drag untuk memindahkan tanda tangan"
                    >
                      <div
                        onMouseDown={onSigMouseDown}
                        style={{
                          position: "absolute",
                          left: `${header.ttdX}px`,
                          top: `${header.ttdY}px`,
                          transform: `translate(-50%, -50%) scale(${header.ttdScale})`,
                          cursor: "move",
                        }}
                      >
                        <img
                          src={header.ttdUrl}
                          alt="Tanda tangan"
                          style={{
                            maxHeight: `${header.ttdHeightMm}mm`, // batas gambar
                            maxWidth: "100%",
                            objectFit: "contain",
                            display: "block",
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

            {netStatus && (
              <p className="mt-4 text-xs text-gray-600">{netStatus}</p>
            )}
          </div>
        </section>
      </div>

      {/* ========== RIWAYAT PANEL ========== */}
      {historyOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">
                Riwayat (Google Sheets)
              </h3>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
            {historyLoading && <p className="text-sm">Memuat...</p>}
            {historyError && (
              <p className="text-sm text-red-600">Error: {historyError}</p>
            )}
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
                  {historyRows.map((r: any) => (
                    <tr key={r.idx}>
                      <td className="p-2 border">{r.tanggal}</td>
                      <td className="p-2 border">{r.nomorSP}</td>
                      <td className="p-2 border">{r.jenis}</td>
                      <td className="p-2 border">{r.ringkasan}</td>
                      <td className="p-2 border">
                        <button
                          onClick={() => restoreFromRow(r)}
                          className="px-2 py-1 border rounded-lg text-xs"
                        >
                          Pulihkan
                        </button>
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
