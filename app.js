import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit";

const TEMPLATE_BASE = ""; 
const { PDFDocument, StandardFonts } = PDFLib;

function isoToDDMMYYYY(iso){
  if(!iso) return "";
  const [y,m,d]=iso.split("-");
  return `${d}/${m}/${y}`;
}

function upper(s){ return (s||"").toUpperCase().trim(); }

function getVol(n){
  const g = id => (document.getElementById(`${id}_${n}`)?.value || "").trim();
  const c = id => !!document.getElementById(`${id}_${n}`)?.checked;

  const up = s => (s || "").toUpperCase().trim();

  return {
    arr: {
      date: g("arr_date"),
      flt: up(g("arr_flt")),
      from: up(g("arr_from")),
      reg: up(g("arr_reg")),
      type: up(g("arr_type")),
      hold_search: c("hold_search"),
      max5: c("max5") // checkbox id expected: max5_1 / max5_2
    },
    dep: {
      date: g("dep_date"),
      flt: up(g("dep_flt")),
      to: up(g("dep_to")),
      reg: up(g("dep_reg")),
      type: up(g("dep_type"))
    }
  };
}

function isVolEmpty(v){
  return !v.arr.date&&!v.arr.flt&&!v.dep.date&&!v.dep.flt;
}

function parking(n){ return document.getElementById(`parking_${n}`)?.value||"" }
function rzaName(){ return upper(window._rzaName || ""); }

const DOCS={

/* ========= BINGO ========= */

BINGO_FR:{
 file: `${TEMPLATE_BASE}/templates/BINGO.pdf`,
 fill:({vol1})=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "REGISTRATION": vol1.dep.reg,
   "TO": vol1.dep.to,
   }),
 flatten:true
},

/* ========= LIR RYANAIR ========= */

LIR_RYANAIR:{
  file: `${TEMPLATE_BASE}/templates/LIR RYANAIR BELLOVA.pdf`,
  fill:({vol1}, extra = null)=>{
    const x = lirTypeX(vol1.dep.type);

    const hold = !!extra?.hold_search;
    const max5 = !!extra?.max5;

    return {
      "DATE": isoToDDMMYYYY(vol1.dep.date),
      "REGISTRATION": vol1.dep.reg,
      "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
      "TO": vol1.dep.to,
      "A/C TYPE": vol1.dep.type,

      "B737": x.B737,
      "B738": x.B738,
      "B38M": x.B38M,

      // ✅ SI multiligne
      "SI": extra?.si || "",

      // ✅ MAX 5 (texte)
      "MAX 5": max5 ? "MAX 5" : "",

      // ✅ HOLD conditionnel
      "ARRIVAL FLIGHT NUMBER": hold ? (vol1.arr.flt || "") : "",
      "HOLD SECURITY SEARCH": hold,
     
    };
  },
  flatten:true
},
  
/* ========= LIR LAUDA ========= */

LIR_LAUDA:{
 file: `${TEMPLATE_BASE}/templates/lauda-lir.pdf`,
 fill:({vol1})=>({
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "REGISTRATION": vol1.dep.reg,
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "FROM": "BVA", // forcé
   "TO": vol1.dep.to
 }),
 flatten:true
},

/* ========= BBCG (Wizz) ========= */

BBCG_GATE:{
 file: `${TEMPLATE_BASE}/templates/BBCG_Apr2020_Rev1 - BAGGAGE BINGO CARD_GATE.pdf`,
 fill:({vol1})=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "TO": vol1.dep.to,
   "GATE NUMBER": ""
 }),
 flatten:true
},

/* ========= WAIF (Wizz) ========= */

WAIF:{
 file: `${TEMPLATE_BASE}/templates/WAIF_Jun2021_Rev1.1_ WALKAROUND INSPECTION FORM.pdf`,
 fill:({vol1})=>({
   "STATION": "BVA", // forcé
   "ARRIVAL FLIGHT NUMBER": vol1.arr.flt,
   "DATE": isoToDDMMYYYY(vol1.arr.date),
   "REGISTRATION": vol1.arr.reg,
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "DATE_2": isoToDDMMYYYY(vol1.dep.date) // si ton 2e champ date s'appelle autrement, remplace DATE_2
 }),
 flatten:true
},

/* ========= RTB (Wizz) ========= */

RTB:{
 file: `${TEMPLATE_BASE}/templates/RTB_Mar2025_Rev3_Ready To Board.pdf`,
 fill:({vol1})=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "ROUTE": `BVA-${vol1.dep.to}`,
   "REGISTRATION": vol1.dep.reg
 }),
 flatten:true
},

/* ========= AUTOCONTROLE ========= */

AUTOCONTROLE:{
  file: `${TEMPLATE_BASE}/templates/Autocontrôle.pdf`,
  fill:({vol1,vol2})=>{
    const o = {};
    const name = rzaName();

    const hasV1 = !isVolEmpty(vol1);
    const hasV2 = !isVolEmpty(vol2);

    // ===== VOL A =====
    if(hasV1){
      o["VOL A - NOM PRENOM"] = name;
      o["FLIGHT A - DEPARTURE FLIGHT NUMBER"] = vol1.dep.flt;
      o["FLIGHT A - DATE"] = isoToDDMMYYYY(vol1.dep.date);
      o["FLIGHT A - TO"] = vol1.dep.to;
    }

    // ===== VOL B =====
    if(hasV2){
      o["VOL B - NOM PRENOM"] = name;
      o["FLIGHT B - DEPARTURE FLIGHT NUMBER"] = vol2.dep.flt;
      o["FLIGHT B - DATE"] = isoToDDMMYYYY(vol2.dep.date);
      o["FLIGHT B - TO"] = vol2.dep.to;
    }

    return o;
  },
  flatten:true
},
  
/* ========= PRESTATIONS DÉPART ========= */

PRESTA_DEP:{
 file: `${TEMPLATE_BASE}/templates/Suivi prestations basés départ.pdf`,
 fill:({vol1,vol2})=>{
   const o={};

   if(!isVolEmpty(vol1)){
     o["FLIGHT A - IMMATRICULATION"] = vol1.dep.reg;
     o["FLIGHT A - DATE"] = isoToDDMMYYYY(vol1.dep.date);
     o["FLIGHT A - STAND"] = parking(1);
     o["FLIGHT A - DEPARTURE FLIGHT NUMBER"] = vol1.dep.flt;
     o["FLIGHT A - TO"] = vol1.dep.to;
   }

   if(!isVolEmpty(vol2)){
     o["FLIGHT B - IMMATRICULATION"] = vol2.dep.reg;
     o["FLIGHT B - DATE"] = isoToDDMMYYYY(vol2.dep.date);
     o["FLIGHT B - STAND"] = parking(2);
     o["FLIGHT B - DEPARTURE FLIGHT NUMBER"] = vol2.dep.flt;
     o["FLIGHT B - TO"] = vol2.dep.to;
   }

   return o;
 },
 flatten:true
},

/* ========= PRESTATIONS ARRIVÉE ========= */

PRESTA_RET:{
 file: `${TEMPLATE_BASE}/templates/Suivi prestations basés arrivée.pdf`,
 fill:({vol1,vol2})=>{
   const o={};

   if(!isVolEmpty(vol1)){
     o["FLIGHT A - IMMATRICULATION"] = vol1.arr.reg;
     o["FLIGHT A - DATE"] = isoToDDMMYYYY(vol1.arr.date);
     o["FLIGHT A - STAND"] = parking(1);
     o["FLIGHT A - ARRIVAL FLIGHT NUMBER"] = vol1.arr.flt;
     o["FLIGHT A - FROM"] = vol1.arr.from;
   }

   if(!isVolEmpty(vol2)){
     o["FLIGHT B - IMMATRICULATION"] = vol2.arr.reg;
     o["FLIGHT B - DATE"] = isoToDDMMYYYY(vol2.arr.date);
     o["FLIGHT B - STAND"] = parking(2);
     o["FLIGHT B - ARRIVAL FLIGHT NUMBER"] = vol2.arr.flt;
     o["FLIGHT B - FROM"] = vol2.arr.from;
   }

   return o;
 },
 flatten:true
}

};
;

/* ---------- MOTEUR PDF ---------- */

function sleep(ms){
  return new Promise(r => setTimeout(r, ms));
}

async function fetchArrayBuffer(url, label){
  try{
    const res = await fetch(url, {
      cache: "no-store",
      credentials: "include"
    });

    if(!res.ok) throw new Error(`${label} HTTP ${res.status} (${url})`);
    return await res.arrayBuffer();
  }catch(e){
    throw new Error(`${label} FETCH ERROR (${url}) → ${e?.message || e}`);
  }
}

// ✅ version retry (label + retries) + credentials/include
async function fetchArrayBufferRetry(url, label, retries = 3, delayMs = 400){
  let lastErr;
  for(let i = 0; i <= retries; i++){
    try{
      const res = await fetch(url, {
        cache: "force-cache",
        credentials: "include"
      });

      if(!res.ok) throw new Error(`${label} HTTP ${res.status} (${url})`);
      return await res.arrayBuffer();

    }catch(e){
      lastErr = e;
      if(i === retries) break;
      await sleep(delayMs * (i + 1));
    }
  }
  throw new Error(`${label} FETCH ERROR (${url}) → ${lastErr?.message || lastErr}`);
}

const _templateCache = new Map();
async function getTemplateBytes(def, docKey) {
  if (_templateCache.has(docKey)) return _templateCache.get(docKey);
  const bytes = await fetchArrayBufferRetry(def.file, "TEMPLATE", 3);
  _templateCache.set(docKey, bytes);
  return bytes;
}

let _arialBytes = null;
let _arialBoldBytes = null;
async function getFontsBytes(BASE) {
  if (_arialBytes && _arialBoldBytes) return { arial: _arialBytes, bold: _arialBoldBytes };

  const [a, b] = await Promise.all([
    fetchArrayBufferRetry(BASE + "fonts/ARIAL.TTF", "FONT ARIAL", 3),
    fetchArrayBufferRetry(BASE + "fonts/ARIAL-BOLD.TTF", "FONT ARIAL-BOLD", 3),
  ]);

  _arialBytes = a;
  _arialBoldBytes = b;
  return { arial: _arialBytes, bold: _arialBoldBytes };
}

// (optionnel) utilitaires de nom de fichier — pas utilisés pour l'impression iframe
function safeFilePart(s){
  return String(s || "")
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_");
}

function ymd(isoDate){
  if(!isoDate) return "";
  const [y,m,d] = String(isoDate).split("-");
  if(!y || !m || !d) return "";
  return `${y}${m}${d}`;
}

function buildPdfFilename(docKey, volTarget, v1, v2){
  if(volTarget === "both"){
    const d1 = ymd(v1?.dep?.date || v1?.arr?.date);
    const d2 = ymd(v2?.dep?.date || v2?.arr?.date);
    return `${safeFilePart(docKey)}_${d1 || "VOL1"}_${d2 || "VOL2"}.pdf`;
  }

  const v = (volTarget === "2") ? v2 : v1;
  const date = ymd(v?.dep?.date || v?.arr?.date);
  const flt  = safeFilePart(v?.dep?.flt || v?.arr?.flt || "");
  return `${safeFilePart(docKey)}_${date || "DATE"}${flt ? "_" + flt : ""}.pdf`;
}

async function fillAndPrint(docKey, volTarget = "1", extra = null) {
  const def = DOCS[docKey];
  if (!def) return;

  const v1 = getVol(1);
  const v2 = getVol(2);

  const vol1 = (volTarget === "2") ? v2 : v1;
  const vol2 = (volTarget === "2") ? v1 : v2;

  const BASE = new URL("./", location.href).toString();

  const templateBytes = await getTemplateBytes(def, docKey);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const form = pdfDoc.getForm();

  // 🔎 DEBUG : liste exacte des champs
  console.log("=== CHAMPS PDF ===");
  const allFields = form.getFields();
  allFields.forEach(f => console.log("[" + f.getName() + "]"));

  const { arial, bold } = await getFontsBytes(BASE);
  const font     = await pdfDoc.embedFont(arial);
  const fontBold = await pdfDoc.embedFont(bold);

  const fields =
    (volTarget === "both")
      ? def.fill({ vol1: v1, vol2: v2 }, extra)
      : def.fill({ vol1, vol2 }, extra);

  // 🔎 Trouve automatiquement le vrai champ SI
  let siFieldName = null;
  for (const f of allFields) {
    const n = f.getName();
    if (n.trim().toUpperCase() === "SI" ||
        n.toUpperCase().endsWith(".SI") ||
        n.toUpperCase().includes("SI")) {
      siFieldName = n;
      break;
    }
  }

  if (siFieldName) {
    console.log("SI détecté sous le nom :", siFieldName);
  } else {
    console.warn("⚠ Aucun champ SI détecté dans le PDF");
  }

  for (const [name, raw] of Object.entries(fields)) {
    try {

      // ===== BOOLEAN -> CHECKBOX =====
      if (typeof raw === "boolean") {
        const cb = form.getCheckBox(name);
        raw ? cb.check() : cb.uncheck();
        continue;
      }

      const rawStr = String(raw ?? "");
      const value = (name === "SI") ? rawStr : rawStr.toUpperCase();

      // ===== CHECKBOX "X" (sauf SI / MAX 5) =====
      if (name !== "SI" && name !== "MAX 5") {
        try {
          const cb = form.getCheckBox(name);
          if (value === "X") cb.check();
          else cb.uncheck();
          continue;
        } catch {}
      }

      // ===== TEXTFIELDS =====
      if (name === "SI") {
        if (!siFieldName) continue;

        const tf = form.getTextField(siFieldName);

        tf.setText(rawStr.replace(/\r\n/g, "\n"));
        tf.setAlignment(PDFLib.TextAlignment.Left);

        if (typeof tf.setFontSize === "function")
          tf.setFontSize(12);

        tf.updateAppearances(font);
      } else {
        const tf = form.getTextField(name);

        tf.setText(value);

        const isName = name.includes("NOM PRENOM");
        tf.setAlignment(isName ? PDFLib.TextAlignment.Left : PDFLib.TextAlignment.Center);

        tf.updateAppearances(value === "X" ? fontBold : font);
      }

    } catch (e) {
      console.warn("Champ PDF introuvable ou incompatible:", name, e?.message || e);
    }
  }

  form.flatten();

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };
}

// ===== boutons PDF =====
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-doc]");
  if (!b) return;

  const docKey = b.dataset.doc;
  const volTarget = b.dataset.vol || "1";

  if(docKey === "AUTOCONTROLE"){
    openRZAModal({ docKey, volTarget });
    return;
  }

  // ✅ popup SI uniquement pour LIR_RYANAIR (vol 1 ou 2)
  if(docKey === "LIR_RYANAIR" && volTarget !== "both"){
    openSIModal({ docKey, volTarget });
    return;
  }

  try {
    await fillAndPrint(docKey, volTarget);
  } catch (err) {
    console.error(err);
    alert(err?.message || String(err));
  }
});

// ===== SI MODAL (LIR Ryanair) =====
let _pendingSIPrint = null;
window._lirSiByVol ||= { "1": "", "2": "" };

function openSIModal(pending){
  _pendingSIPrint = pending;

  const vol = String(pending?.volTarget || "1");
  const v = getVol(Number(vol));

  const b = document.getElementById("siBackdrop");
  const m = document.getElementById("siModal");
  const t = document.getElementById("siModalInput");
  const cbMax5 = document.getElementById("siModalMax5");
  const cbHold = document.getElementById("siModalHold");

  if(t){
    t.value = window._lirSiByVol[vol] || "";
    setTimeout(()=> t.focus(), 0);
  }

  // MAX5 default: coché si B38M
  const isB38M = upper(v?.dep?.type) === "B38M";
  if(cbMax5) cbMax5.checked = isB38M;

  // HOLD default: décoché
  if(cbHold) cbHold.checked = false;

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeSIModal(keepPending){
  const b = document.getElementById("siBackdrop");
  const m = document.getElementById("siModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  if(!keepPending) _pendingSIPrint = null;
}

async function submitSIModal(){
  const t  = document.getElementById("siModalInput");
  const cbMax5 = document.getElementById("siModalMax5");
  const cbHold = document.getElementById("siModalHold");

  const p = _pendingSIPrint;
  if(!p) return;

  const vol = String(p.volTarget || "1");
  const v = getVol(Number(vol)); // gardé si tu t'en sers ailleurs

  const si = (t?.value || "");
  window._lirSiByVol[vol] = si;

  // ✅ MAX 5 = ce que tu coches, point.
  const max5 = !!cbMax5?.checked;

  const hold_search = !!cbHold?.checked;

  closeSIModal(true);
  _pendingSIPrint = null;

  await fillAndPrint(p.docKey, p.volTarget, { si, max5, hold_search });
}

// IMPORTANT (car app.js est en module)
window.openSIModal = openSIModal;
window.closeSIModal = closeSIModal;
window.submitSIModal = submitSIModal;

function lirTypeX(acType){
  const t = upper(acType);

  const isB737 = t === "B737";
  const isB738 = t === "B738";
  const isB38M = t === "B38M";

  return {
    B737: (isB737 ? "" : "X"),
    B738: (isB738 ? "" : "X"),
    B38M: (isB38M ? "" : "X"),
  };
}

// ===== RZA MODAL (Autocontrôle uniquement) =====
let _pendingPrint = null;

function openRZAModal(pending){
  _pendingPrint = pending;

  const b = document.getElementById("rzaBackdrop");
  const m = document.getElementById("rzaModal");
  const i = document.getElementById("rzaModalInput");
  const h = document.getElementById("rzaHelp");

  if(h) h.style.display = "none";
  if(i){
    i.value = window._rzaName || "";
    setTimeout(()=> i.focus(), 0);
  }

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeRZAModal(keepPending){
  const b = document.getElementById("rzaBackdrop");
  const m = document.getElementById("rzaModal");
  const h = document.getElementById("rzaHelp");

  if(h) h.style.display = "none";
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";

  if(!keepPending) _pendingPrint = null;
}

async function submitRZAModal(){
  const i = document.getElementById("rzaModalInput");
  const h = document.getElementById("rzaHelp");

  const v = (i?.value || "").trim();
  if(!v){
    if(h) h.style.display = "block";
    if(i) i.focus();
    return;
  }

  window._rzaName = v;

  const p = _pendingPrint;
  closeRZAModal(true);
  _pendingPrint = null;

  if(p){
    await fillAndPrint(p.docKey, p.volTarget);
  }
}

// IMPORTANT (car app.js est en module)
window.openRZAModal = openRZAModal;
window.closeRZAModal = closeRZAModal;
window.submitRZAModal = submitRZAModal;

/* =========================
   AirportKeeper
   - Liste DEP = SOBT
   - Liste ARR = SIBT
   - Association par linkedId (strict)
     * DEP -> ARR : linkedId + même jour obligatoire (SOBT == SIBT), sinon rien
     * ARR -> DEP : linkedId (strict)
   - Badges UI : ARR et DEP indépendants
     * 5–14  => retardé orange
     * >=15  => retardé rouge
     * <5    => à l'heure vert
     * <=-5  => en avance bleu
   ========================= */

const AK_PROXY = "/ak";

function $(id){ return document.getElementById(id); }

function isoToYYYYMMDD(iso){
  if(!iso) return "";
  const d = new Date(iso);
  if(isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

// ===== temps "moteur" (au cas où) =====
function arrTimeMs(f){
  return Date.parse(f?.aibt || f?.eibt || f?.sibt || f?.aldt || f?.eldt || f?.afat || f?.efat || '') || null;
}
function depTimeMs(f){
  return Date.parse(f?.aobt || f?.eobt || f?.pobt || f?.ctot || f?.etot || f?.sobt || '') || null;
}

// ===== temps "LISTE" (affichage + tri) =====
function depListMs(f){ return Date.parse(f?.sobt || "") || null; } // ✅ SOBT
function arrListMs(f){ return Date.parse(f?.sibt || "") || null; } // ✅ SIBT

async function fetchAK(flow, from, to){
  const url =
    `${AK_PROXY}?flow=${encodeURIComponent(flow)}` +
    `&from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}`;

  const res = await fetch(url);
  if(!res.ok) throw new Error(`AK error ${res.status}`);

  const data = await res.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.flights)) return data.flights;
  if (Array.isArray(data?.data)) return data.data;

  console.log("AK payload inconnu:", data);
  return [];
}

function hhmmFromMs(ms){
  if(ms == null) return "--:--";
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${hh}:${mm}`;
}

const NBSP = "\u00A0";

function padCol(s, w){
  s = String(s ?? "");
  // coupe si trop long
  if(s.length > w) return s.slice(0, w);
  // complète avec espaces insécables
  return s + NBSP.repeat(w - s.length);
}

function buildDepLabel(f){
  const t     = hhmmFromMs(depListMs(f)); // "09:55"
  const flt   = upper(f?.fullFlightNumber || f?.callsign || "");
  const to    = upper(f?.adesIata || f?.adesIcao || "");
  const regRaw= upper(f?.reg || "");
  const reg   = regRaw || "-----";
  const stand = (f?.pkg || "").toString().replace(/^P/i,"").trim();
  const p     = stand ? `P${stand}` : "";

  const departed = Number.isFinite(Date.parse(f?.atot || ""));

  // colonnes
  const cTime = padCol(t || "--:--", 6);      // 5 + 1
  const cFlt  = padCol(flt || "—", 8);
  const cTo   = padCol(to || "---", 4);
  const cReg  = padCol(reg, 7);
  const cPk   = padCol(p || "", 5);

  return `${cTime}${cFlt}🛫 ${cTo}${cReg}${cPk}${departed ? "DÉCOLLÉ" : ""}`;
}

function buildArrLabel(f){
  const t     = hhmmFromMs(arrListMs(f));
  const flt   = upper(f?.fullFlightNumber || f?.callsign || "");
  const from  = upper(f?.adepIata || f?.adepIcao || "");
  const regRaw= upper(f?.reg || "");
  const reg   = regRaw || "-----";
  const stand = (f?.pkg || "").toString().replace(/^P/i,"").trim();
  const p     = stand ? `P${stand}` : "";

  // ✅ ARRIVÉ si AIBT connu
  const arrived = Number.isFinite(Date.parse(f?.aibt || ""));

  // ✅ DÉCOLLÉ basé sur le DEP lié
  const lid = String(f?.linkedId || "").trim();
  const dep = lid ? (window._akDepById?.get(lid) || null) : null;
  const departed = Number.isFinite(Date.parse(dep?.atot || ""));

  // priorité au statut DÉCOLLÉ
  let status = "";
  if(departed){
    status = "DÉCOLLÉ";
  } else if(arrived){
    status = "ARRIVÉ";
  }

  const cTime = padCol(t || "--:--", 6);
  const cFlt  = padCol(flt || "—", 8);
  const cFrom = padCol(from || "---", 4);
  const cReg  = padCol(reg, 7);
  const cPk   = padCol(p || "", 5);

  return `${cTime}${cFlt}🛬 ${cFrom}${cReg}${cPk}${status ? " " + status : ""}`;
}

function setVal(id, v){
  const el = $(id);
  if(!el) return;
  el.value = (v ?? "");
  el.dispatchEvent(new Event("input", {bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
}

/* =========================
   LIENS ARR <-> DEP (linkedId strict)
   ========================= */

function ymdUTC(iso){
  if(!iso) return "";
  const t = Date.parse(iso);
  if(!t) return "";
  return new Date(t).toISOString().slice(0,10); // YYYY-MM-DD (UTC)
}

function sameDayDepArr(dep, arr){
  const depDay = ymdUTC(dep?.sobt || dep?.eobt || dep?.aobt || "");
  const arrDay = ymdUTC(arr?.sibt || arr?.eibt || arr?.aibt || arr?.eldt || "");
  return !!depDay && !!arrDay && depDay === arrDay;
}

// DEP -> ARR via linkedId + même jour obligatoire
function findLinkedArrForDepSameDay(dep, arrAll){
  const lid = String(dep?.linkedId || "").trim();
  if(!lid) return null;

  const arr = (arrAll || []).find(a => String(a?.id || "") === lid) || null;
  if(!arr) return null;

  if(!sameDayDepArr(dep, arr)) return null;
  return arr;
}

// ARR -> DEP via linkedId strict
function findLinkedDepForArr(arr, depAll){
  const lid = String(arr?.linkedId || "").trim();
  if(!lid) return null;
  return (depAll || []).find(d => String(d?.id || "") === lid) || null;
}

function applyArrToVol(n, arr){
  if(!arr) return;

  const arrIso = arr?.sibt || arr?.eibt || arr?.aibt || arr?.aldt || arr?.eldt || arr?.afat || arr?.efat || "";
  setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));
  setVal(`arr_flt_${n}`, upper(arr?.fullFlightNumber || arr?.callsign || ""));
  setVal(`arr_from_${n}`, upper(arr?.adepIata || arr?.adepIcao || ""));
  setVal(`arr_reg_${n}`, upper(arr?.reg || ""));
  setVal(`arr_type_${n}`, akAcType(arr));

  const stand = (arr?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);
}

function applyDepOnlyToVol(n, dep){
  if(!dep) return;

  const depIso = dep?.sobt || dep?.eobt || dep?.aobt || dep?.pobt || dep?.ctot || dep?.etot || dep?.atot || "";
  setVal(`dep_date_${n}`, isoToYYYYMMDD(depIso));
  setVal(`dep_flt_${n}`, upper(dep?.fullFlightNumber || dep?.callsign || ""));
  setVal(`dep_to_${n}`, upper(dep?.adesIata || dep?.adesIcao || ""));
  setVal(`dep_reg_${n}`, upper(dep?.reg || ""));
  setVal(`dep_type_${n}`, akAcType(dep));

  const stand = (dep?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);
}

function applyDepToVol(n, dep, arrAll){
  if(!dep) return;

  // ===== DEPART =====
  const depIso = dep?.sobt || dep?.eobt || dep?.aobt || dep?.pobt || dep?.ctot || dep?.etot || dep?.atot || "";
  setVal(`dep_date_${n}`, isoToYYYYMMDD(depIso));

  setVal(`dep_flt_${n}`, upper(dep?.fullFlightNumber || dep?.callsign || ""));
  setVal(`dep_to_${n}`, upper(dep?.adesIata || dep?.adesIcao || ""));
  setVal(`dep_reg_${n}`, upper(dep?.reg || ""));
  setVal(`dep_type_${n}`, akAcType(dep));

  const stand = (dep?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);

  // ===== ARRIVEE liée (linkedId + même jour obligatoire) =====
  const prevArr = findLinkedArrForDepSameDay(dep, arrAll);

  if(prevArr){
    const arrIso = prevArr?.sibt || prevArr?.eibt || prevArr?.aibt || prevArr?.aldt || prevArr?.eldt || prevArr?.afat || prevArr?.efat || "";
    setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));

    setVal(`arr_flt_${n}`, upper(prevArr?.fullFlightNumber || prevArr?.callsign || ""));
    setVal(`arr_from_${n}`, upper(prevArr?.adepIata || prevArr?.adepIcao || ""));
    setVal(`arr_reg_${n}`, upper(prevArr?.reg || dep?.reg || ""));
    setVal(`arr_type_${n}`, akAcType(prevArr) || akAcType(dep));
  } else {
    // si pas de liée (ou pas le même jour), on ne remplit pas l'arrivée
    // mais on garde au minimum reg/type côté ARR si tu veux
    setVal(`arr_reg_${n}`, "");
    setVal(`arr_type_${n}`, "");
    setVal(`arr_date_${n}`, "");
    setVal(`arr_flt_${n}`, "");
    setVal(`arr_from_${n}`, "");
  }
}

function akAcType(f){
  return upper(
    f?.acTypeIcao ||
    f?.acTypeIata ||
    f?.aircraftDetails?.acTypeName ||
    ""
  );
}

function resetVolUI(volNum) {
  const ids = [
    `arr_date_${volNum}`,
    `arr_flt_${volNum}`,
    `arr_from_${volNum}`,
    `dep_date_${volNum}`,
    `dep_flt_${volNum}`,
    `dep_to_${volNum}`,
    `parking_${volNum}`,
    `dep_reg_${volNum}`,
    `dep_type_${volNum}`,
    `arr_reg_${volNum}`,
    `arr_type_${volNum}`
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.type === "checkbox") el.checked = false;
    else el.value = "";
  });

  const arrBadges = document.getElementById(`arr_badges_${volNum}`);
  const depBadges = document.getElementById(`dep_badges_${volNum}`);
  if (arrBadges) arrBadges.innerHTML = "";
  if (depBadges) depBadges.innerHTML = "";
}

/* =========================
   BADGES RETARD (UI)
   ========================= */

function delayMinFrom(plannedIso, actualIso){
  const p = Date.parse(plannedIso || "");
  const a = Date.parse(actualIso || "");
  if(!p || !a) return null;
  return Math.round((a - p) / 60000);
}

function actualDepIso(f){
  // départ : AOBT > EOBT
  return f?.aobt || f?.eobt || "";
}
function actualArrIso(f){
  // arrivée : AIBT > ELDT > EIBT
  return f?.aibt || f?.eldt || f?.eibt || "";
}

function renderDelayBadge(containerEl, mins){
  if(!containerEl || mins == null) return;

  let label = "";
  let color = "";

  if(mins >= 15){
    label = `RETARDÉ +${mins}`;
    color = "is-danger";
  }
  else if(mins >= 5){
    label = `RETARDÉ +${mins}`;
    color = "is-warning";
  }
  else if(mins <= -5){
    label = `EN AVANCE ${mins}`;
    color = "is-info";
  }
  else{
    label = "À L’HEURE";
    color = "is-success";
  }

  const span = document.createElement("span");
  span.className = `tag ${color}`;
  span.style.fontWeight = "900";
  span.textContent = label;
  containerEl.appendChild(span);
}

function updateBadgesFromFlights(n, depFlight, arrFlight){
  const depWrap = $(`dep_badges_${n}`);
  const arrWrap = $(`arr_badges_${n}`);
  if(depWrap) depWrap.innerHTML = "";
  if(arrWrap) arrWrap.innerHTML = "";

  if(depFlight && depWrap){
    const planned = depFlight?.sobt || "";
    const actual  = actualDepIso(depFlight);
    renderDelayBadge(depWrap, delayMinFrom(planned, actual));
  }

  if(arrFlight && arrWrap){
    const planned = arrFlight?.sibt || "";
    const actual  = actualArrIso(arrFlight);
    renderDelayBadge(arrWrap, delayMinFrom(planned, actual));
  }
}

function clearBadges(n){
  const a = $(`arr_badges_${n}`);
  const d = $(`dep_badges_${n}`);
  if(a) a.innerHTML = "";
  if(d) d.innerHTML = "";
}

/* =========================
   LOAD + DROPDOWNS
   ========================= */

async function loadAKAll(){
  const st1 = $("ak_status_1");
  const st2 = $("ak_status_2");
  if(st1) st1.textContent = "Chargement…";
  if(st2) st2.textContent = "Chargement…";

  const now = new Date();
  const nowMs = now.getTime();

  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
  const endDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);

  // fenêtre large pour récupérer toutes les liaisons
  const linkFromDate = new Date(startDay.getTime() - 12*60*60*1000);
  const linkToDate   = new Date(endDay.getTime()   + 12*60*60*1000);
  const linkFrom = linkFromDate.toISOString().replace(/\.\d{3}Z$/, "Z");
  const linkTo   = linkToDate.toISOString().replace(/\.\d{3}Z$/, "Z");

  try{
    const [arrAll, depAll] = await Promise.all([
      fetchAK("ARR", linkFrom, linkTo),
      fetchAK("DEP", linkFrom, linkTo),
    ]);

    // ✅ index DEP par id (utile pour ARR -> DEP lié)
    const depById = new Map((depAll || []).map(d => [String(d?.id ?? ""), d]));
    window._akDepById = depById;

    const inTodayDep = (f)=>{
      const sobt = Date.parse(f?.sobt || "");
      if(!sobt) return false;
      if(sobt < startDay.getTime() || sobt > endDay.getTime()) return false;

      // ✅ masque si ATOT + 30 min est passé
      const atot = Date.parse(f?.atot || "");
      if(atot && (atot + 30*60*1000) < nowMs) return false;

      return true;
    };
    const depToday = depAll.filter(inTodayDep);

    const inTodayArr = (f)=>{
      const t = Date.parse(f?.sibt || "");
      if(!(t && t >= startDay.getTime() && t <= endDay.getTime())) return false;

      // ✅ si arrivée liée à un DEP qui a ATOT+30 dépassé → on masque l’arrivée
      const lid = String(f?.linkedId || "").trim();
      if(lid){
        const dep = window._akDepById?.get(lid) || null;
        const atot = Date.parse(dep?.atot || "");
        if(Number.isFinite(atot) && (atot + 30*60*1000) < nowMs) return false;
      }

      return true;
    };
    const arrToday = arrAll.filter(inTodayArr);

    depToday.sort((a,b)=> (Date.parse(a?.sobt || "") || 1e18) - (Date.parse(b?.sobt || "") || 1e18));
    arrToday.sort((a,b)=> (Date.parse(a?.sibt || "") || 1e18) - (Date.parse(b?.sibt || "") || 1e18));

    window._akArrAll   = arrAll;
    window._akDepAll   = depAll;
    window._akDepToday = depToday;
    window._akArrToday = arrToday;

    refreshAKDropdown(1);
    refreshAKDropdown(2);

  }catch(e){
    const msg = `Erreur AK (${String(e.message || e)})`;
    if(st1) st1.textContent = msg;
    if(st2) st2.textContent = msg;
  }
}

function refreshAKDropdown(n){
  const flowSel = $(`ak_flow_${n}`);
  const sel = $(`ak_flight_${n}`);
  const st  = $(`ak_status_${n}`);
  if(!flowSel || !sel) return;

  const flow = flowSel.value; // "DEP" ou "ARR"
  const list = (flow === "DEP") ? (window._akDepToday || []) : (window._akArrToday || []);

  sel.innerHTML = `<option value="">-- Choisir un vol --</option>`;
  for(const f of list){
    const opt = document.createElement("option");
    opt.value = String(f?.id ?? "");
    opt.textContent = (flow === "DEP") ? buildDepLabel(f) : buildArrLabel(f);
    sel.appendChild(opt);
  }

  if(st) st.textContent = `${list.length} vol(s)`;
}

function bindAK(n){
  const flowSel = $(`ak_flow_${n}`);
  const sel = $(`ak_flight_${n}`);
  if(!flowSel || !sel) return;

  flowSel.addEventListener("change", ()=>{
    refreshAKDropdown(n);
    clearBadges(n);
    resetVolUI(n); // ✅ reset quand tu changes DEP/ARR
  });

  sel.addEventListener("change", ()=>{
    const id = sel.value;
    if(!id){
      clearBadges(n);
      resetVolUI(n); // ✅ reset si tu remets "-- Choisir un vol --"
      return;
    }

    resetVolUI(n); // ✅ reset avant de remplir

    const flow = flowSel.value;

    if(flow === "DEP"){
      const dep = (window._akDepToday || []).find(f => String(f?.id ?? "") === String(id));
      if(!dep) return;

      applyDepToVol(n, dep, window._akArrAll || []);

      const linkedArr = findLinkedArrForDepSameDay(dep, window._akArrAll || []);
      updateBadgesFromFlights(n, dep, linkedArr);

    } else {
      const arr = (window._akArrToday || []).find(f => String(f?.id ?? "") === String(id));
      if(!arr) return;

      applyArrToVol(n, arr);

      const linkedDep = findLinkedDepForArr(arr, window._akDepAll || []);
      if(linkedDep) applyDepOnlyToVol(n, linkedDep);

      updateBadgesFromFlights(n, linkedDep || null, arr);
    }
  });
}

// boot
document.addEventListener("DOMContentLoaded", ()=>{
  bindAK(1);
  bindAK(2);
  loadAKAll();

  // ✅ Auto refresh toutes les 30 minutes
  setInterval(() => {
    loadAKAll();
  }, 30 * 60 * 1000);
});
