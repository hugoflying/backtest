import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit";

const TEMPLATE_BASE = "";
const { PDFDocument } = PDFLib;

/* =========================
   UTILITAIRES
   ========================= */

function isoToDDMMYYYY(iso){
  if(!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function upper(s){ return (s || "").toUpperCase().trim(); }

function $(id){ return document.getElementById(id); }

function getVol(n){
  const g = id => ($(`${id}_${n}`)?.value || "").trim();
  const c = id => !!$(`${id}_${n}`)?.checked;
  return {
    arr: {
      date:        g("arr_date"),
      flt:         upper(g("arr_flt")),
      from:        upper(g("arr_from")),
      reg:         upper(g("arr_reg")),
      type:        upper(g("arr_type")),
      hold_search: c("hold_search"),
      max5:        c("max5"),
    },
    dep: {
      date: g("dep_date"),
      flt:  upper(g("dep_flt")),
      to:   upper(g("dep_to")),
      reg:  upper(g("dep_reg")),
      type: upper(g("dep_type")),
    }
  };
}

function isVolEmpty(v){
  return !v.arr.date && !v.arr.flt && !v.dep.date && !v.dep.flt;
}

function parking(n){ return $(`parking_${n}`)?.value || ""; }
function rzaName(){  return upper(_rzaName); }

function bestDepIso(f){
  return f?.sobt || f?.eobt || f?.aobt || f?.pobt || f?.ctot || f?.etot || f?.atot || "";
}
function bestArrIso(f){
  return f?.sibt || f?.eibt || f?.aibt || f?.aldt || f?.eldt || f?.afat || f?.efat || "";
}

/* =========================
   ÉTAT MODULE
   ========================= */

let _rzaName          = "";
let _lirSiByVol       = { "1": "", "2": "" };
let _menageByVol      = { "1": "", "2": "" };
let _bbcgByVol        = {
  "1": { gate: "", comp: "", bingoCard: "1", bingoOf: "1" },
  "2": { gate: "", comp: "", bingoCard: "1", bingoOf: "1" },
};
let _akArrAll         = [];
let _akDepAll         = [];
let _akDepToday       = [];
let _akArrToday       = [];
let _akDepById        = new Map();
let _autoRefreshTimer = null;
let _useUTC           = false;

/* =========================
   CHAMPS CRITIQUES (bloquants)
   ========================= */

const CRITICAL_FIELDS = {
  BINGO_FR:    ["DATE", "DEPARTURE FLIGHT NUMBER"],
  LIR_RYANAIR: ["DATE", "DEPARTURE FLIGHT NUMBER", "REGISTRATION"],
  LIR_LAUDA:   ["DATE", "DEPARTURE FLIGHT NUMBER"],
  BBCG_GATE:   ["DATE", "DEPARTURE FLIGHT NUMBER"],
  WAIF:        ["DATE", "DEPARTURE FLIGHT NUMBER"],
  RTB:         ["DATE", "DEPARTURE FLIGHT NUMBER"],
  AUTOCONTROLE:[],
  PRESTA_DEP:  [],
  PRESTA_RET:  [],
};

/* =========================
   DOCS PDF
   ========================= */

const DOCS = {

BINGO_FR: {
  file: `${TEMPLATE_BASE}/templates/BINGO.pdf`,
  fill: ({ vol1 }) => ({
    "DATE":                    isoToDDMMYYYY(vol1.dep.date),
    "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
    "REGISTRATION":            vol1.dep.reg,
    "TO":                      vol1.dep.to,
  }),
  flatten: true
},

LIR_RYANAIR: {
  file: `${TEMPLATE_BASE}/templates/LIR RYANAIR BELLOVA.pdf`,
  fill: ({ vol1 }, extra = null) => {
    const x    = lirTypeX(vol1.dep.type);
    const hold = !!extra?.hold_search;
    const max5 = !!extra?.max5;
    return {
      "DATE":                    isoToDDMMYYYY(vol1.dep.date),
      "REGISTRATION":            vol1.dep.reg,
      "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
      "TO":                      vol1.dep.to,
      "A/C TYPE":                vol1.dep.type,
      "B737":                    x.B737,
      "B738":                    x.B738,
      "B38M":                    x.B38M,
      "SI":                      extra?.si || "",
      "MAX 5":                   max5 ? "MAX 5" : "",
      "ARRIVAL FLIGHT NUMBER":   hold ? (vol1.arr.flt || "") : "",
    };
  },
  flatten: true
},

LIR_LAUDA: {
  file: `${TEMPLATE_BASE}/templates/lauda-lir.pdf`,
  fill: ({ vol1 }) => ({
    "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
    "REGISTRATION":            vol1.dep.reg,
    "DATE":                    isoToDDMMYYYY(vol1.dep.date),
    "FROM":                    "BVA",
    "TO":                      vol1.dep.to,
  }),
  flatten: true
},

BBCG_GATE: {
  file: `${TEMPLATE_BASE}/templates/BBCG_Apr2020_Rev1 - BAGGAGE BINGO CARD_GATE.pdf`,
  fill: ({ vol1 }, extra = null) => ({
    "DATE":                    isoToDDMMYYYY(vol1.dep.date),
    "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
    "TO":                      vol1.dep.to,
    "GATE NUMBER":             upper(String(extra?.gate     || "")),
    "LOAD COMPARTMENT":        upper(String(extra?.comp     || "")),
    "Bingo Card":              String(extra?.bingoCard || "").trim(),
    "Of":                      String(extra?.bingoOf   || "").trim(),
  }),
  flatten: true
},

WAIF: {
  file: `${TEMPLATE_BASE}/templates/WAIF_Jun2021_Rev1.1_ WALKAROUND INSPECTION FORM.pdf`,
  fill: ({ vol1 }) => ({
    "STATION":                 "BVA",
    "ARRIVAL FLIGHT NUMBER":   vol1.arr.flt,
    "DATE":                    isoToDDMMYYYY(vol1.arr.date),
    "REGISTRATION":            vol1.arr.reg,
    "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
    "DATE_2":                  isoToDDMMYYYY(vol1.dep.date),
  }),
  flatten: true
},

RTB: {
  file: `${TEMPLATE_BASE}/templates/RTB_Mar2025_Rev3_Ready To Board.pdf`,
  fill: ({ vol1 }) => ({
    "DATE":                    isoToDDMMYYYY(vol1.dep.date),
    "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
    "ROUTE":                   `BVA-${vol1.dep.to}`,
    "REGISTRATION":            vol1.dep.reg,
  }),
  flatten: true
},

AUTOCONTROLE: {
  file: `${TEMPLATE_BASE}/templates/Autocontrôle.pdf`,
  fill: ({ vol1, vol2 }) => {
    const o    = {};
    const name = rzaName();
    if(!isVolEmpty(vol1)){
      o["VOL A - NOM PRENOM"]                 = name;
      o["FLIGHT A - DEPARTURE FLIGHT NUMBER"] = vol1.dep.flt;
      o["FLIGHT A - DATE"]                    = isoToDDMMYYYY(vol1.dep.date);
      o["FLIGHT A - TO"]                      = vol1.dep.to;
    }
    if(!isVolEmpty(vol2)){
      o["VOL B - NOM PRENOM"]                 = name;
      o["FLIGHT B - DEPARTURE FLIGHT NUMBER"] = vol2.dep.flt;
      o["FLIGHT B - DATE"]                    = isoToDDMMYYYY(vol2.dep.date);
      o["FLIGHT B - TO"]                      = vol2.dep.to;
    }
    return o;
  },
  flatten: true
},

PRESTA_DEP: {
  file: `${TEMPLATE_BASE}/templates/Suivi prestations basés départ.pdf`,
  fill: ({ vol1, vol2 }) => {
    const o = {};
    if(!isVolEmpty(vol1)){
      o["FLIGHT A - IMMATRICULATION"]         = vol1.dep.reg;
      o["FLIGHT A - DATE"]                    = isoToDDMMYYYY(vol1.dep.date);
      o["FLIGHT A - STAND"]                   = parking(1);
      o["FLIGHT A - DEPARTURE FLIGHT NUMBER"] = vol1.dep.flt;
      o["FLIGHT A - TO"]                      = vol1.dep.to;
    }
    if(!isVolEmpty(vol2)){
      o["FLIGHT B - IMMATRICULATION"]         = vol2.dep.reg;
      o["FLIGHT B - DATE"]                    = isoToDDMMYYYY(vol2.dep.date);
      o["FLIGHT B - STAND"]                   = parking(2);
      o["FLIGHT B - DEPARTURE FLIGHT NUMBER"] = vol2.dep.flt;
      o["FLIGHT B - TO"]                      = vol2.dep.to;
    }
    return o;
  },
  flatten: true,
  duplex:  "DuplexFlipLongEdge"
},

PRESTA_RET: {
  file: `${TEMPLATE_BASE}/templates/Suivi prestations basés arrivée.pdf`,
  fill: ({ vol1, vol2 }, extra = null) => {
    const o = {};
    if(!isVolEmpty(vol1)){
      o["FLIGHT A - IMMATRICULATION"]       = vol1.arr.reg;
      o["FLIGHT A - DATE"]                  = isoToDDMMYYYY(vol1.arr.date);
      o["FLIGHT A - STAND"]                 = parking(1);
      o["FLIGHT A - ARRIVAL FLIGHT NUMBER"] = vol1.arr.flt;
      o["FLIGHT A - FROM"]                  = vol1.arr.from;
    }
    if(!isVolEmpty(vol2)){
      o["FLIGHT B - IMMATRICULATION"]       = vol2.arr.reg;
      o["FLIGHT B - DATE"]                  = isoToDDMMYYYY(vol2.arr.date);
      o["FLIGHT B - STAND"]                 = parking(2);
      o["FLIGHT B - ARRIVAL FLIGHT NUMBER"] = vol2.arr.flt;
      o["FLIGHT B - FROM"]                  = vol2.arr.from;
    }
    const m1 = extra?.menage?.["1"] || "";
    const m2 = extra?.menage?.["2"] || "";
    o["FLIGHT A - MENAGE TIDY"] = m1 === "TIDY" ? "X" : "";
    o["FLIGHT A - MENAGE FULL"] = m1 === "FULL" ? "X" : "";
    o["FLIGHT B - MENAGE TIDY"] = m2 === "TIDY" ? "X" : "";
    o["FLIGHT B - MENAGE FULL"] = m2 === "FULL" ? "X" : "";
    return o;
  },
  flatten: true,
  duplex:  "DuplexFlipLongEdge"
},

};

/* =========================
   MOTEUR PDF
   ========================= */

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function fetchArrayBufferRetry(url, label, retries = 3, delayMs = 400){
  let lastErr;
  for(let i = 0; i <= retries; i++){
    try{
      const res = await fetch(url, { cache: "force-cache", credentials: "include" });
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
async function getTemplateBytes(def, docKey){
  if(_templateCache.has(docKey)) return _templateCache.get(docKey);
  const bytes = await fetchArrayBufferRetry(def.file, "TEMPLATE", 3);
  _templateCache.set(docKey, bytes);
  return bytes;
}

let _robotoCondBoldBytes = null;
async function getFontsBytes(BASE){
  if(_robotoCondBoldBytes) return { bold: _robotoCondBoldBytes };
  _robotoCondBoldBytes = await fetchArrayBufferRetry(
    BASE + "fonts/RobotoCondensed-Bold.ttf", "FONT RobotoCondensed-Bold", 3
  );
  return { bold: _robotoCondBoldBytes };
}

async function buildPdfBytes(docKey, volTarget = "1", extra = null){
  const def = DOCS[docKey];
  if(!def) throw new Error(`Document inconnu : ${docKey}`);

  const v1   = getVol(1);
  const v2   = getVol(2);
  const vol1 = (volTarget === "2") ? v2 : v1;
  const vol2 = (volTarget === "2") ? v1 : v2;

  const BASE          = new URL("./", location.href).toString();
  const templateBytes = await getTemplateBytes(def, docKey);
  const pdfDoc        = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const form       = pdfDoc.getForm();
  const allFields  = form.getFields();
  const fieldNames = new Set(allFields.map(f => f.getName()));

  const { bold } = await getFontsBytes(BASE);
  const fontBold = await pdfDoc.embedFont(bold);

  const siFieldName = allFields
    .map(f => f.getName())
    .find(n => { const u = n.trim().toUpperCase(); return u === "SI" || u.endsWith(".SI"); })
    ?? null;

  const fields =
    (volTarget === "both")
      ? def.fill({ vol1: v1, vol2: v2 }, extra)
      : def.fill({ vol1, vol2 }, extra);

  // Vérification des champs critiques — bloquant
  const criticals = CRITICAL_FIELDS[docKey] || [];
  const missing   = criticals.filter(name => !String(fields[name] ?? "").trim());
  if(missing.length > 0){
    throw new Error(
      `${docKey} — champ(s) obligatoire(s) manquant(s) :\n${missing.join(", ")}\n\nVérifiez que le vol est bien sélectionné.`
    );
  }

  for(const [name, raw] of Object.entries(fields)){
    try{
      if(typeof raw === "boolean"){
        const cb = form.getCheckBox(name);
        raw ? cb.check() : cb.uncheck();
        continue;
      }

      const rawStr = String(raw ?? "");
      const value  = name === "SI" ? rawStr : rawStr.toUpperCase();

      if(name !== "SI" && name !== "MAX 5"){
        try{
          const cb = form.getCheckBox(name);
          value === "X" ? cb.check() : cb.uncheck();
          continue;
        }catch{}
      }

      if(name === "SI"){
        if(!siFieldName) continue;
        const tf = form.getTextField(siFieldName);
        tf.setText(rawStr.replace(/\r\n/g, "\n"));
        tf.setAlignment(PDFLib.TextAlignment.Left);
        if(typeof tf.setFontSize === "function") tf.setFontSize(14);
        tf.updateAppearances(fontBold);
      }else{
        if(!fieldNames.has(name)){ console.warn(`Champ ignoré : ${name}`); continue; }
        const tf = form.getTextField(name);
        tf.setText(value);
        tf.setAlignment(
          name.includes("NOM PRENOM")
            ? PDFLib.TextAlignment.Left
            : PDFLib.TextAlignment.Center
        );
        tf.updateAppearances(fontBold);
      }
    }catch(e){
      console.warn("Champ PDF incompatible :", name, e?.message || e);
    }
  }

  form.updateFieldAppearances(fontBold);
  form.flatten();
  return await pdfDoc.save();
}

async function mergeAndPrint(jobs){
  const allBytes = await Promise.all(
    jobs.map(j => buildPdfBytes(j.docKey, j.volTarget ?? "1", j.extra ?? null))
  );

  const merged = await PDFDocument.create();
  for(const bytes of allBytes){
    if(!bytes) continue;
    const src   = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }

  const allDuplex = jobs.every(j => DOCS[j.docKey]?.duplex === "DuplexFlipLongEdge");
  const duplexVal = allDuplex ? "DuplexFlipLongEdge" : "Simplex";

  // ViewerPreferences — uniquement si PDFName est disponible dans cette version de pdf-lib
  try{
    const PDFName = PDFLib.PDFName;
    if(PDFName){
      merged.catalog.set(
        PDFName.of("ViewerPreferences"),
        merged.context.obj({
          Duplex:       PDFName.of(duplexVal),
          PrintScaling: PDFName.of("None"),
        })
      );
    }
  }catch(e){
    console.warn("ViewerPreferences non supporté:", e?.message);
  }

  const bytes = await merged.save();
  const blob  = new Blob([bytes], { type: "application/pdf" });
  const url   = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0"
  });
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { URL.revokeObjectURL(url); iframe.remove(); }, 1000);
  };
}

async function fillAndPrint(docKey, volTarget = "1", extra = null){
  await mergeAndPrint([{ docKey, volTarget, extra }]);
}

/* =========================
   BOUTONS PDF (délégation)
   ========================= */

document.addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-doc]");
  if(!b) return;

  const docKey    = b.dataset.doc;
  const volTarget = b.dataset.vol || "1";

  if(docKey === "AUTOCONTROLE")                        { openRZAModal({ docKey, volTarget });    return; }
  if(docKey === "LIR_RYANAIR" && volTarget !== "both") { openSIModal({ docKey, volTarget });     return; }
  if(docKey === "PRESTA_RET")                          { openMenageModal({ docKey, volTarget }); return; }
  if(docKey === "BBCG_GATE")                           { openBBCGModal({ docKey, volTarget });   return; }

  try{
    await fillAndPrint(docKey, volTarget);
  }catch(err){
    console.error(err);
    alert(err?.message || String(err));
  }
});

/* =========================
   MODAL — MÉNAGE
   ========================= */

let _pendingMenagePrint = null;

function setMenageUI(vol, value){
  $(`menage${vol}TidyBtn`)?.classList.toggle("menage-on", value === "TIDY");
  $(`menage${vol}FullBtn`)?.classList.toggle("menage-on", value === "FULL");
}

function bindMenageButtons(){
  [1, 2].forEach(vol => {
    const key     = String(vol);
    const tidyBtn = $(`menage${vol}TidyBtn`);
    const fullBtn = $(`menage${vol}FullBtn`);
    if(!tidyBtn || !fullBtn) return;
    tidyBtn.onclick = () => {
      _menageByVol[key] = _menageByVol[key] === "TIDY" ? "" : "TIDY";
      setMenageUI(vol, _menageByVol[key]);
    };
    fullBtn.onclick = () => {
      _menageByVol[key] = _menageByVol[key] === "FULL" ? "" : "FULL";
      setMenageUI(vol, _menageByVol[key]);
    };
  });
}

function openMenageModal(pending){
  _pendingMenagePrint = pending;
  setMenageUI(1, _menageByVol["1"]);
  setMenageUI(2, _menageByVol["2"]);
  bindMenageButtons();
  $("menageBackdrop").style.display = "block";
  $("menageModal").style.display    = "flex";
}

function closeMenageModal(keepPending){
  $("menageBackdrop").style.display = "none";
  $("menageModal").style.display    = "none";
  if(!keepPending) _pendingMenagePrint = null;
}

async function submitMenageModal(){
  const p = _pendingMenagePrint;
  if(!p) return;
  closeMenageModal(true);
  _pendingMenagePrint = null;
  try{
    await fillAndPrint(p.docKey, p.volTarget, {
      menage: { "1": _menageByVol["1"], "2": _menageByVol["2"] }
    });
  }catch(err){ alert(err?.message || String(err)); }
}

window.openMenageModal   = openMenageModal;
window.closeMenageModal  = closeMenageModal;
window.submitMenageModal = submitMenageModal;

/* =========================
   MODAL — BBCG GATE
   ========================= */

let _pendingBBCGPrint = null;

function defaultCompFromAcType(acType){
  const t = upper(acType);
  if(t === "A320" || t === "A20N")                  return "CP1";
  if(t === "A321" || t === "A21NY" || t === "A21N") return "CP3";
  return "";
}

function openBBCGModal(pending){
  _pendingBBCGPrint = pending;
  const vol = String(pending?.volTarget || "1");
  _bbcgByVol[vol] ??= { gate: "", comp: "", bingoCard: "1", bingoOf: "1" };

  const data        = _bbcgByVol[vol];
  const acType      = $(`dep_type_${vol}`)?.value || "";
  const compDefault = data.comp || defaultCompFromAcType(acType);

  const gateEl = $("bbcgGate");
  if($("bbcgGate"))      $("bbcgGate").value      = data.gate      || "";
  if($("bbcgComp"))      $("bbcgComp").value      = compDefault    || "";
  if($("bbcgBingoCard")) $("bbcgBingoCard").value  = data.bingoCard || "1";
  if($("bbcgBingoOf"))   $("bbcgBingoOf").value    = data.bingoOf   || "1";

  $("bbcgBackdrop").style.display = "block";
  $("bbcgModal").style.display    = "flex";
  setTimeout(() => gateEl?.focus?.(), 0);
}

function closeBBCGModal(keepPending){
  $("bbcgBackdrop").style.display = "none";
  $("bbcgModal").style.display    = "none";
  if(!keepPending) _pendingBBCGPrint = null;
}

async function submitBBCGModal(){
  const p = _pendingBBCGPrint;
  if(!p) return;
  const vol       = String(p.volTarget || "1");
  const gate      = ($("bbcgGate")?.value      || "").trim();
  const comp      = ($("bbcgComp")?.value      || "").trim();
  const bingoCard = ($("bbcgBingoCard")?.value || "1").trim();
  const bingoOf   = ($("bbcgBingoOf")?.value   || "1").trim();

  _bbcgByVol[vol] = { gate, comp, bingoCard, bingoOf };
  closeBBCGModal(true);
  _pendingBBCGPrint = null;
  try{
    await fillAndPrint(p.docKey, p.volTarget, { gate, comp, bingoCard, bingoOf });
  }catch(err){ alert(err?.message || String(err)); }
}

window.openBBCGModal   = openBBCGModal;
window.closeBBCGModal  = closeBBCGModal;
window.submitBBCGModal = submitBBCGModal;

/* =========================
   MODAL — SI (LIR Ryanair)
   ========================= */

let _pendingSIPrint = null;

function openSIModal(pending){
  _pendingSIPrint = pending;
  const vol    = String(pending?.volTarget || "1");
  const v      = getVol(Number(vol));
  const tEl    = $("siModalInput");
  const cbMax5 = $("siModalMax5");
  const cbHold = $("siModalHold");

  if(tEl){ tEl.value = _lirSiByVol[vol] || ""; setTimeout(() => tEl.focus(), 0); }
  if(cbMax5) cbMax5.checked = upper(v?.dep?.type) === "B38M";
  if(cbHold) cbHold.checked = false;
  if($("siModalPoussettesPorte")) $("siModalPoussettesPorte").value = "";
  if($("siModalPoussettesCBS"))   $("siModalPoussettesCBS").value   = "";

  $("siBackdrop").style.display = "block";
  $("siModal").style.display    = "flex";
}

function closeSIModal(keepPending){
  $("siBackdrop").style.display = "none";
  $("siModal").style.display    = "none";
  if(!keepPending) _pendingSIPrint = null;
}

async function submitSIModal(){
  const p = _pendingSIPrint;
  if(!p) return;
  const vol         = String(p.volTarget || "1");
  const siRaw       = $("siModalInput")?.value || "";
  const max5        = !!$("siModalMax5")?.checked;
  const hold_search = !!$("siModalHold")?.checked;

  const nPorte = parseInt($("siModalPoussettesPorte")?.value || "", 10);
  const nCBS   = parseInt($("siModalPoussettesCBS")?.value   || "", 10);
  const parts  = [];
  if(!isNaN(nPorte) && nPorte > 0)
    parts.push(nPorte === 1 ? "1 poussette porte" : `${nPorte} poussettes porte`);
  if(!isNaN(nCBS) && nCBS > 0)
    parts.push(nCBS === 1 ? "1 poussette CBS" : `${nCBS} poussettes CBS`);

  const prefix = parts.join("\n");
  const si = prefix && siRaw.trim()
    ? prefix + "\n" + siRaw.trim()
    : prefix || siRaw.trim();

  _lirSiByVol[vol] = siRaw;
  closeSIModal(true);
  _pendingSIPrint = null;

  const printBingo = !!$("siModalBingo")?.checked;
  const jobs = [{ docKey: p.docKey, volTarget: p.volTarget, extra: { si, max5, hold_search } }];
  if(printBingo) jobs.push({ docKey: "BINGO_FR", volTarget: p.volTarget });

  try{
    await mergeAndPrint(jobs);
  }catch(err){ alert(err?.message || String(err)); }
}

window.openSIModal   = openSIModal;
window.closeSIModal  = closeSIModal;
window.submitSIModal = submitSIModal;

/* =========================
   MODAL — RZA (Autocontrôle)
   ========================= */

let _pendingPrint = null;

function openRZAModal(pending){
  _pendingPrint = pending;
  const iEl = $("rzaModalInput");
  const hEl = $("rzaHelp");
  if(hEl) hEl.style.display = "none";
  if(iEl){ iEl.value = _rzaName; setTimeout(() => iEl.focus(), 0); }
  $("rzaBackdrop").style.display = "block";
  $("rzaModal").style.display    = "flex";
}

function closeRZAModal(keepPending){
  if($("rzaHelp")) $("rzaHelp").style.display = "none";
  $("rzaBackdrop").style.display = "none";
  $("rzaModal").style.display    = "none";
  if(!keepPending) _pendingPrint = null;
}

async function submitRZAModal(){
  const iEl = $("rzaModalInput");
  const hEl = $("rzaHelp");
  const v   = (iEl?.value || "").trim();
  if(!v){
    if(hEl) hEl.style.display = "block";
    if(iEl) iEl.focus();
    return;
  }
  _rzaName = v;
  const p  = _pendingPrint;
  closeRZAModal(true);
  _pendingPrint = null;
  if(p){
    try{ await fillAndPrint(p.docKey, p.volTarget); }
    catch(err){ alert(err?.message || String(err)); }
  }
}

window.openRZAModal   = openRZAModal;
window.closeRZAModal  = closeRZAModal;
window.submitRZAModal = submitRZAModal;

/* =========================
   HELPERS AIRCRAFT TYPE
   ========================= */

function lirTypeX(acType){
  const t = upper(acType);
  return {
    B737: t === "B737" ? "" : "X",
    B738: t === "B738" ? "" : "X",
    B38M: t === "B38M" ? "" : "X",
  };
}

/* =========================
   AIRPORTKEEPER — FETCH
   ========================= */

const AK_PROXY = "/ak";

function isoToYYYYMMDD(iso){
  if(!iso) return "";
  const d = new Date(iso);
  if(isNaN(d.getTime())) return "";
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function depListMs(f){ return Date.parse(f?.sobt || "") || null; }
function arrListMs(f){ return Date.parse(f?.sibt || "") || null; }

async function fetchAK(flow, from, to){
  const url =
    `${AK_PROXY}?flow=${encodeURIComponent(flow)}` +
    `&from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}`;

  let res;
  try{
    res = await fetch(url, { cache: "no-store", credentials: "include", redirect: "manual" });
  }catch(e){
    throw new Error(`AK fetch network error: ${e?.message || e} (url=${url})`);
  }

  if(
    res.type === "opaqueredirect" ||
    res.status === 0 ||
    (res.status >= 300 && res.status < 400) ||
    res.redirected
  ){
    window.location.reload();
    return [];
  }

  if(!res.ok) throw new Error(`AK error ${res.status} (url=${url})`);

  const data = await res.json();
  if(Array.isArray(data))          return data;
  if(Array.isArray(data?.flights)) return data.flights;
  if(Array.isArray(data?.data))    return data.data;
  console.warn("AK payload inconnu:", data);
  return [];
}

/* =========================
   LABELS DROPDOWN
   ========================= */

const NBSP = "\u00A0";

function padCol(s, w){
  s = String(s ?? "");
  if(s.length > w) return s.slice(0, w);
  return s + NBSP.repeat(w - s.length);
}

function hhmmFromMs(ms){
  if(ms == null) return "--:--";
  const d  = new Date(ms);
  const hh = String(_useUTC ? d.getUTCHours()   : d.getHours())  .padStart(2, "0");
  const mm = String(_useUTC ? d.getUTCMinutes()  : d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildFlightLabel(f, flow){
  const isArr = flow === "ARR";
  const t     = hhmmFromMs(isArr ? arrListMs(f) : depListMs(f));
  const flt   = upper(f?.fullFlightNumber || f?.callsign || "");
  const iata  = upper(isArr
    ? (f?.adepIata || f?.adepIcao || "")
    : (f?.adesIata || f?.adesIcao || ""));
  const reg   = upper(f?.reg || "") || "-----";
  const stand = (f?.pkg || "").toString().replace(/^P/i, "").trim();
  const p     = stand ? `P${stand}` : "";
  const lid   = String(f?.linkedId || "").trim();

  let status = "";
  if(isArr){
    const arrived  = Number.isFinite(Date.parse(f?.aibt || ""));
    const dep      = lid ? (_akDepById.get(lid) || null) : null;
    const departed = Number.isFinite(Date.parse(dep?.atot || ""));
    if(departed)     status = "DÉCOLLÉ";
    else if(arrived) status = "ARRIVÉ";
  }else{
    const arr      = lid ? _akArrAll.find(a => String(a?.id || "") === lid) : null;
    const arrived  = Number.isFinite(Date.parse(arr?.aibt || ""));
    const departed = Number.isFinite(Date.parse(f?.atot || ""));
    if(departed)     status = "DÉCOLLÉ";
    else if(arrived) status = "ARRIVÉ";
  }

  return [
    padCol(t    || "--:--", 6),
    padCol(flt  || "—",     8),
    isArr ? "🛬 " : "🛫 ",
    padCol(iata || "---",   4),
    padCol(reg,             7),
    padCol(p   || "",       5),
    status ? " " + status : ""
  ].join("");
}

function setVal(id, v){
  const el = $(id);
  if(!el) return;
  el.value = (v ?? "");
  el.dispatchEvent(new Event("input",  { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/* =========================
   LIENS ARR <-> DEP
   ========================= */

function ymdUTC(iso){
  if(!iso) return "";
  const t = Date.parse(iso);
  if(!t) return "";
  return new Date(t).toISOString().slice(0, 10);
}

function sameDayDepArr(dep, arr){
  const depDay = ymdUTC(dep?.sobt || dep?.eobt || dep?.aobt || "");
  const arrDay = ymdUTC(arr?.sibt || arr?.eibt || arr?.aibt || arr?.eldt || "");
  return !!depDay && !!arrDay && depDay === arrDay;
}

function findLinkedArrForDepSameDay(dep, arrAll){
  const lid = String(dep?.linkedId || "").trim();
  if(!lid) return null;
  const arr = (arrAll || []).find(a => String(a?.id || "") === lid) || null;
  if(!arr || !sameDayDepArr(dep, arr)) return null;
  return arr;
}

function findLinkedDepForArr(arr, depAll){
  const lid = String(arr?.linkedId || "").trim();
  if(!lid) return null;
  return (depAll || []).find(d => String(d?.id || "") === lid) || null;
}

/* =========================
   APPLY VOL
   ========================= */

function applyArrToVol(n, arr){
  if(!arr) return;
  setVal(`arr_date_${n}`, isoToYYYYMMDD(bestArrIso(arr)));
  setVal(`arr_flt_${n}`,  upper(arr?.fullFlightNumber || arr?.callsign || ""));
  setVal(`arr_from_${n}`, upper(arr?.adepIata || arr?.adepIcao || ""));
  setVal(`arr_reg_${n}`,  upper(arr?.reg || ""));
  setVal(`arr_type_${n}`, akAcType(arr));
  const stand = (arr?.pkg || "").toString().replace(/^P/i, "").trim();
  if(stand) setVal(`parking_${n}`, stand);
}

function applyDepOnlyToVol(n, dep){
  if(!dep) return;
  setVal(`dep_date_${n}`, isoToYYYYMMDD(bestDepIso(dep)));
  setVal(`dep_flt_${n}`,  upper(dep?.fullFlightNumber || dep?.callsign || ""));
  setVal(`dep_to_${n}`,   upper(dep?.adesIata || dep?.adesIcao || ""));
  setVal(`dep_reg_${n}`,  upper(dep?.reg || ""));
  setVal(`dep_type_${n}`, akAcType(dep));
  const stand = (dep?.pkg || "").toString().replace(/^P/i, "").trim();
  if(stand) setVal(`parking_${n}`, stand);
}

function applyDepToVol(n, dep, arrAll){
  if(!dep) return;
  applyDepOnlyToVol(n, dep);
  const prevArr = findLinkedArrForDepSameDay(dep, arrAll);
  if(prevArr){
    setVal(`arr_date_${n}`, isoToYYYYMMDD(bestArrIso(prevArr)));
    setVal(`arr_flt_${n}`,  upper(prevArr?.fullFlightNumber || prevArr?.callsign || ""));
    setVal(`arr_from_${n}`, upper(prevArr?.adepIata || prevArr?.adepIcao || ""));
    setVal(`arr_reg_${n}`,  upper(prevArr?.reg || dep?.reg || ""));
    setVal(`arr_type_${n}`, akAcType(prevArr) || akAcType(dep));
  }else{
    ["arr_reg", "arr_type", "arr_date", "arr_flt", "arr_from"]
      .forEach(k => setVal(`${k}_${n}`, ""));
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

/* =========================
   RESET UI VOL
   ========================= */

function resetVolUI(volNum){
  ["arr_date","arr_flt","arr_from","dep_date","dep_flt","dep_to",
   "parking","dep_reg","dep_type","arr_reg","arr_type"].forEach(k => {
    const el = $(`${k}_${volNum}`);
    if(!el) return;
    if(el.type === "checkbox") el.checked = false;
    else el.value = "";
  });
  $(`arr_badges_${volNum}`)?.replaceChildren();
  $(`dep_badges_${volNum}`)?.replaceChildren();
}

/* =========================
   BADGES RETARD
   ========================= */

const EIBT_CORRECTION_MIN = -4;

function addMinutesToIso(iso, minutes){
  const t = Date.parse(iso || "");
  if(!Number.isFinite(t)) return "";
  return new Date(t + minutes * 60000).toISOString();
}

function delayMinFrom(plannedIso, actualIso){
  const p = Date.parse(plannedIso || "");
  const a = Date.parse(actualIso  || "");
  if(!Number.isFinite(p) || !Number.isFinite(a)) return null;
  return Math.round((a - p) / 60000);
}

function actualDepIso(f){ return f?.aobt || f?.eobt || ""; }

function actualArrIso(f){
  if(f?.aibt) return f.aibt;
  if(f?.eibt) return addMinutesToIso(f.eibt, EIBT_CORRECTION_MIN);
  return "";
}

function getDelayStatus(mins){
  if(mins == null) return null;
  if(mins <= -11) return { label: `EN AVANCE ${mins}`, bulma: "is-info"    };
  if(mins <= 5)   return { label: "À L'HEURE",          bulma: "is-success" };
  if(mins < 15)   return { label: `RETARDÉ +${mins}`,   bulma: "is-warning" };
  return           { label: `RETARDÉ +${mins}`,          bulma: "is-danger"  };
}

function renderDelayBadge(containerEl, mins){
  if(!containerEl || mins == null) return;
  const status = getDelayStatus(mins);
  if(!status) return;
  const span = document.createElement("span");
  span.className        = `tag ${status.bulma}`;
  span.style.fontWeight = "900";
  span.textContent      = status.label;
  containerEl.appendChild(span);
}

function updateBadgesFromFlights(n, depFlight, arrFlight){
  $(`dep_badges_${n}`)?.replaceChildren();
  $(`arr_badges_${n}`)?.replaceChildren();
  if(depFlight) renderDelayBadge($(`dep_badges_${n}`), delayMinFrom(depFlight?.sobt || "", actualDepIso(depFlight)));
  if(arrFlight) renderDelayBadge($(`arr_badges_${n}`), delayMinFrom(arrFlight?.sibt || "", actualArrIso(arrFlight)));
}

function clearBadges(n){
  $(`arr_badges_${n}`)?.replaceChildren();
  $(`dep_badges_${n}`)?.replaceChildren();
}

/* =========================
   LOAD + DROPDOWNS
   ========================= */

async function loadAKAll(){
  const st1 = $("ak_status_1");
  const st2 = $("ak_status_2");
  if(st1) st1.textContent = "Chargement…";
  if(st2) st2.textContent = "Chargement…";

  const now      = new Date();
  const nowMs    = now.getTime();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const linkFrom = new Date(startDay.getTime() - 12 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const linkTo   = new Date(endDay.getTime()   + 12 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");

  try{
    const [arrAll, depAll] = await Promise.all([
      fetchAK("ARR", linkFrom, linkTo),
      fetchAK("DEP", linkFrom, linkTo),
    ]);

    _akDepById = new Map((depAll || []).map(d => [String(d?.id ?? ""), d]));

    const inTodayDep = f => {
      const sobt = Date.parse(f?.sobt || "");
      if(!sobt || sobt < startDay.getTime() || sobt > endDay.getTime()) return false;
      const atot = Date.parse(f?.atot || "");
      return !(atot && (atot + 30 * 60000) < nowMs);
    };

    const inTodayArr = f => {
      const t = Date.parse(f?.sibt || "");
      if(!(t && t >= startDay.getTime() && t <= endDay.getTime())) return false;
      const lid = String(f?.linkedId || "").trim();
      if(lid){
        const dep  = _akDepById.get(lid) || null;
        const atot = Date.parse(dep?.atot || "");
        if(Number.isFinite(atot) && (atot + 30 * 60000) < nowMs) return false;
      }
      return true;
    };

    _akDepToday = depAll.filter(inTodayDep)
      .sort((a, b) => (Date.parse(a?.sobt || "") || 1e18) - (Date.parse(b?.sobt || "") || 1e18));
    _akArrToday = arrAll.filter(inTodayArr)
      .sort((a, b) => (Date.parse(a?.sibt || "") || 1e18) - (Date.parse(b?.sibt || "") || 1e18));

    _akArrAll = arrAll;
    _akDepAll = depAll;

    refreshAKDropdown(1);
    refreshAKDropdown(2);

  }catch(e){
    const msg = `Erreur AK (${String(e.message || e)})`;
    if(st1) st1.textContent = msg;
    if(st2) st2.textContent = msg;
  }
}

function startAKAutoRefresh(){
  if(_autoRefreshTimer) clearInterval(_autoRefreshTimer);
  _autoRefreshTimer = setInterval(async () => {
    try{
      await loadAKAll();
    }catch(e){
      if(/failed to fetch|network error|fetch/i.test(String(e?.message || e))){
        window.location.reload();
        return;
      }
      console.warn("Auto-refresh AK:", e);
    }
  }, 15 * 60 * 1000);
}

function refreshAKDropdown(n){
  const flowSel = $(`ak_flow_${n}`);
  const sel     = $(`ak_flight_${n}`);
  const st      = $(`ak_status_${n}`);
  if(!flowSel || !sel) return;

  const flow = flowSel.value;
  const list = flow === "DEP" ? _akDepToday : _akArrToday;

  sel.innerHTML = `<option value="">-- Choisir un vol --</option>`;
  for(const f of list){
    const opt       = document.createElement("option");
    opt.value       = String(f?.id ?? "");
    opt.textContent = buildFlightLabel(f, flow);
    sel.appendChild(opt);
  }

  if(st) st.textContent = `${list.length} vol(s)`;
}

function bindAK(n){
  const flowSel = $(`ak_flow_${n}`);
  const sel     = $(`ak_flight_${n}`);
  if(!flowSel || !sel) return;

  flowSel.addEventListener("change", () => {
    refreshAKDropdown(n);
    clearBadges(n);
    resetVolUI(n);
  });

  sel.addEventListener("change", () => {
    const id = sel.value;
    if(!id){ clearBadges(n); resetVolUI(n); return; }

    resetVolUI(n);
    const flow = flowSel.value;

    if(flow === "DEP"){
      const dep = _akDepToday.find(f => String(f?.id ?? "") === String(id));
      if(!dep) return;
      applyDepToVol(n, dep, _akArrAll);
      updateBadgesFromFlights(n, dep, findLinkedArrForDepSameDay(dep, _akArrAll));
    }else{
      const arr = _akArrToday.find(f => String(f?.id ?? "") === String(id));
      if(!arr) return;
      applyArrToVol(n, arr);
      const linkedDep = findLinkedDepForArr(arr, _akDepAll);
      if(linkedDep) applyDepOnlyToVol(n, linkedDep);
      updateBadgesFromFlights(n, linkedDep || null, arr);
    }
  });
}

/* =========================
   BOOT
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  bindAK(1);
  bindAK(2);
  loadAKAll();
  startAKAutoRefresh();
  $("akMenuRefresh")?.addEventListener("click", loadAKAll);

  const utcBtn = $("utcToggle");
  if(utcBtn){
    utcBtn.addEventListener("click", () => {
      _useUTC = !_useUTC;
      utcBtn.title = _useUTC ? "Mode UTC — cliquer pour Local" : "Mode Local — cliquer pour UTC";
      const badge = $("utcBadge");
      if(badge) badge.textContent = _useUTC ? "UTC" : "LT";
      refreshAKDropdown(1);
      refreshAKDropdown(2);
    });
  }
});
