import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit";

const TEMPLATE_BASE = "https://raw.githubusercontent.com/hugoflying/prepavols/main";
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
  file: `${TEMPLATE_BASE}/templates/LIR RYANAIR BELLOVA 2026.pdf`,
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
     
    };
  },
  flatten:true
},
  
/* ========= LIR LAUDA ========= */

LIR_LAUDA:{
 file: `${TEMPLATE_BASE}/templates/lauda-lir 2026.pdf`,
 fill:({vol1}, extra = null)=>({
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "REGISTRATION": vol1.dep.reg,
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "FROM": "BVA", // forcé
   "TO": vol1.dep.to,
   "SI": extra?.si || ""
 }),
 flatten:true
},

/* ========= BBCG (Wizz) ========= */

BBCG_GATE:{
 file: `${TEMPLATE_BASE}/templates/BBCG_Apr2020_Rev1 - BAGGAGE BINGO CARD_GATE.pdf`,
 fill:({vol1}, extra = null)=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "TO": vol1.dep.to,

   // ✅ Popup fields
   "GATE NUMBER": (extra?.gate || "").toString().toUpperCase().trim(),
   "LOAD COMPARTMENT": (extra?.comp || "").toString().toUpperCase().trim(),
   "Bingo Card": (extra?.bingoCard || "").toString().trim(),
   "Of": (extra?.bingoOf || "").toString().trim(),
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
    } else {
      o["FLIGHT A - DATE"] = "        /        /        ";
    }

    // ===== VOL B =====
    if(hasV2){
      o["VOL B - NOM PRENOM"] = name;
      o["FLIGHT B - DEPARTURE FLIGHT NUMBER"] = vol2.dep.flt;
      o["FLIGHT B - DATE"] = isoToDDMMYYYY(vol2.dep.date);
      o["FLIGHT B - TO"] = vol2.dep.to;
    } else {
      o["FLIGHT B - DATE"] = "        /        /        ";
    }

    return o;
  },
  flatten:true
},
  
/* ========= PRESTATIONS DÉPART ========= */

PRESTA_DEP:{
 file: `${TEMPLATE_BASE}/templates/suivi-prestations-bases-arrivee-depart.pdf`,
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
 flatten:true,
 fontSize: 14
},

/* ========= PRESTATIONS ARRIVÉE ========= */

PRESTA_RET:{
 file: `${TEMPLATE_BASE}/templates/suivi-prestations-bases-arrivee-depart.pdf`,
 fill:({vol1,vol2}, extra = null)=>{
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

   const m1 = (extra?.menage?.["1"] || "");
   const m2 = (extra?.menage?.["2"] || "");

   o["FLIGHT A - MENAGE TIDY"] = (m1 === "TIDY") ? "X" : "";
   o["FLIGHT A - MENAGE FULL"] = (m1 === "FULL") ? "X" : "";
   o["FLIGHT B - MENAGE TIDY"] = (m2 === "TIDY") ? "X" : "";
   o["FLIGHT B - MENAGE FULL"] = (m2 === "FULL") ? "X" : "";

   return o;
 },
 flatten:true,
 fontSize: 14
},

/* ========= PRESTATIONS BASÉ (arrivée-départ combiné) ========= */
// Noms exacts des champs vérifiés via Acrobat :
// - FLIGHT A -  FLIGHT NUMBER  (double espace !)
// - FLIGHT B - FLIGHT NUMBER   (simple espace)
// - FLIGHT A - TOILETTES REMPLISSAGE  vs  FLIGHT B - REMPLISSAGE TOILETTES
// - SENS DEPART / SENS ARRIVEE = groupes radio (pas des checkboxes)

PRESTA_BASE:{
 file: `${TEMPLATE_BASE}/templates/suivi-prestations-bases-arrivee-depart.pdf`,
 fill:({vol1,vol2}, extra = null)=>{
   const o={};
   const mode = extra?.mode || "DEP";

   // Lecture directe du DOM (indépendante du snapshot getVol())
   const domVal = (id) => (document.getElementById(id)?.value || "").trim().toUpperCase();

   const fillVol = (letter, vol, pkn) => {
     const isA = (letter === "A");
     const n   = isA ? 1 : 2;

     // FLIGHT NUMBER : espace simple pour A et B (confirmé Acrobat)
     const fltFieldName = `FLIGHT ${letter} - FLIGHT NUMBER`;

     o[`FLIGHT ${letter} - IMMATRICULATION`] = (mode === "DEP") ? vol.dep.reg : vol.arr.reg;
     o[`FLIGHT ${letter} - DATE`]            = (mode === "DEP") ? isoToDDMMYYYY(vol.dep.date) : isoToDDMMYYYY(vol.arr.date);
     o[`FLIGHT ${letter} - STAND`]           = parking(pkn);
     o[`FLIGHT ${letter} - FROM/TO`]         = (mode === "DEP") ? vol.dep.to : vol.arr.from;

     // FLIGHT NUMBER : lecture directe du DOM + nom exact avec double espace pour A
     const fltDep = domVal(`dep_flt_${n}`);
     const fltArr = domVal(`arr_flt_${n}`);
     const fltNum = (mode === "DEP") ? fltDep : fltArr;
     o[fltFieldName] = fltNum;

     if(mode === "DEP"){
       o[`FLIGHT ${letter} - SENS DEPART`]  = "__SELECT__";
       o[`FLIGHT ${letter} - SENS ARRIVEE`] = "__CLEAR__";

       // ⚠ Noms checkboxes différents A vs B pour TOILETTES REMPLISSAGE
       if(isA){
         o["FLIGHT A - TOILETTES REMPLISSAGE"]   = "X";
         o["FLIGHT A - EAU POTABLE REMPLISSAGE"] = "X";
       } else {
         o["FLIGHT B - TOILETTES REMPLISSAGE"]   = "X";
         o["FLIGHT B - EAU POTABLE REMPLISSAGE"] = "X";
       }
       o[`FLIGHT ${letter} - GPU`] = "X";

     } else {
       const mKey = isA ? "1" : "2";
       const m    = (extra?.menage?.[mKey] || "");

       o[`FLIGHT ${letter} - SENS ARRIVEE`] = "__SELECT__";
       o[`FLIGHT ${letter} - SENS DEPART`]  = "__CLEAR__";

       o[`FLIGHT ${letter} - TOILETTES VIDANGE`]   = "X";
       o[`FLIGHT ${letter} - EAU POTABLE VIDANGE`] = "X";
       o[`FLIGHT ${letter} - GPU`]                  = "X";
       o[`FLIGHT ${letter} - COLLECTE DECHETS`]     = "X";
       o[`FLIGHT ${letter} - MENAGE TIDY`]          = (m === "TIDY") ? "X" : "";
       o[`FLIGHT ${letter} - MENAGE FULL`]          = (m === "FULL") ? "X" : "";

       // Page 2 — HOLD SECURITY SEARCH (noms exacts vus dans la console)
       const holdKey = isA ? "1" : "2";
       const isHold = !!(extra?.hold?.[holdKey]);
       if(isHold){
         o[`FLIGHT ${letter} - ARRIVAL HOLD SECURITY SEARCH`] = "__SELECT__";
         o[`FLIGHT ${letter} - ARRIVAL FLIGHT NUMBER`]        = fltArr;
       } else {
         o[`FLIGHT ${letter} - ARRIVAL HOLD SECURITY SEARCH`] = "__CLEAR__";
       }
     }
   };

   if(!isVolEmpty(vol1)) fillVol("A", vol1, 1);
   if(!isVolEmpty(vol2)) fillVol("B", vol2, 2);

   return o;
 },
 flatten:true,
 fontSize: 14
}

};
;

/* ---------- MOTEUR PDF ---------- */

function sleep(ms){
  return new Promise(r => setTimeout(r, ms));
}

// Détecte une redirection Cloudflare Access → recharge la page (re-auth)
async function fetchArrayBuffer(url, label){
  try{
    const res = await fetch(encodeURI(url), {
      cache: "no-store"
    });

    // Seul cas certain d'une session CF Access expirée : redirect vers cloudflareaccess.com
    if(res.url && res.url.includes("cloudflareaccess.com")){
      console.warn("Session Cloudflare expirée, rechargement...", url);
      window.location.reload();
      return new ArrayBuffer(0);
    }

    if(!res.ok) throw new Error(`${label} HTTP ${res.status} (${url})`);
    return await res.arrayBuffer();
  }catch(e){
    throw new Error(`${label} FETCH ERROR (${url}) → ${e?.message || e}`);
  }
}

// version retry + protection Cloudflare Access
async function fetchArrayBufferRetry(url, label, retries = 3, delayMs = 400){
  let lastErr;
  for(let i = 0; i <= retries; i++){
    try{
      const res = await fetch(encodeURI(url), {
        cache: "no-cache"
      });

      // Seul cas certain CF Access expiré
      if(res.url && res.url.includes("cloudflareaccess.com")){
        console.warn("Session Cloudflare expirée, rechargement...", url);
        window.location.reload();
        return new ArrayBuffer(0);
      }

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

let _robotoCondBoldBytes = null;

async function getFontsBytes(BASE) {
  if (_robotoCondBoldBytes) return { bold: _robotoCondBoldBytes };

  const b = await fetchArrayBufferRetry(
    BASE + "fonts/RobotoCondensed-Bold.ttf",
    "FONT RobotoCondensed-Bold",
    3
  );

  _robotoCondBoldBytes = b;
  return { bold: _robotoCondBoldBytes };
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

  // 🔎 DEBUG : liste exacte des champs + types
  const allFields = form.getFields();
  console.group("=== CHAMPS PDF : " + docKey + " ===");
  allFields.forEach(f => {
    const type = f.constructor?.name || "?";
    console.log(`[${f.getName()}] (${type})`);
  });
  console.groupEnd();

  // ✅ Roboto Condensed Bold uniquement
  const { bold } = await getFontsBytes(BASE);
  const fontBold = await pdfDoc.embedFont(bold);

  const fields =
    (volTarget === "both")
      ? def.fill({ vol1: v1, vol2: v2 }, extra)
      : def.fill({ vol1, vol2 }, extra);

  // ⚠️ Avertissement si PRESTA_BASE — champs manquants dans le PDF
  if(docKey === "PRESTA_BASE"){
    const knownNames = new Set(allFields.map(f => f.getName()));
    const missed = Object.keys(fields).filter(k => !knownNames.has(k));
    if(missed.length > 0){
      console.warn("⚠ PRESTA_BASE — champs introuvables dans le PDF:", missed);
      console.info("Champs réels disponibles:", [...knownNames]);
    }
  }

  // 🔎 Trouve automatiquement le vrai champ SI
  let siFieldName = null;
  for (const f of allFields) {
    const n = f.getName();
    const u = n.trim().toUpperCase();
    if (u === "SI" || u.endsWith(".SI") || u.includes("SI")) {
      siFieldName = n;
      break;
    }
  }

  if (siFieldName) console.log("SI détecté sous le nom :", siFieldName);
  else console.warn("⚠ Aucun champ SI détecté dans le PDF");

  for (const [name, raw] of Object.entries(fields)) {
    try {
      // ===== __SELECT__ / __CLEAR__ -> GROUPES RADIO =====
      if (raw === "__SELECT__") {
        try {
          const rg = form.getRadioGroup(name);
          const opts = rg.getOptions();
          if (opts.length > 0) rg.select(opts[0]);
        } catch(e) {
          console.warn("⚠ Radio SELECT échoué:", name, e?.message);
        }
        continue;
      }
      if (raw === "__CLEAR__") {
        try {
          const rg = form.getRadioGroup(name);
          rg.clear();
        } catch {} // ignorer si pas radio ou déjà vide
        continue;
      }

      // ===== BOOLEAN -> CHECKBOX ou TEXT =====
      if (typeof raw === "boolean") {
        let handled = false;
        try {
          const cb = form.getCheckBox(name);
          raw ? cb.check() : cb.uncheck();
          handled = true;
        } catch {}

        if (!handled && raw) {
          try {
            const tf = form.getTextField(name);
            tf.setText("X");
            tf.updateAppearances(fontBold);
            handled = true;
          } catch {}
        }

        if (!handled) {
          console.warn("⚠ Boolean non géré (ni checkbox ni textField):", name);
        }
        continue;
      }

      const rawStr = String(raw ?? "");
      const value = (name === "SI" || name === "SPECIAL INSTRUCTIONS") ? rawStr : rawStr.toUpperCase();

      // ===== CHECKBOX "X" (sauf SI / SPECIAL INSTRUCTIONS / MAX 5) =====
      if (name !== "SI" && name !== "SPECIAL INSTRUCTIONS" && name !== "MAX 5") {
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

        if (typeof tf.setFontSize === "function") tf.setFontSize(14);

        tf.updateAppearances(fontBold);
      } else if (name === "SPECIAL INSTRUCTIONS") {
        try {
          const tf = form.getTextField("SPECIAL INSTRUCTIONS");
          tf.setText(rawStr.replace(/\r\n/g, "\n"));
          tf.setAlignment(PDFLib.TextAlignment.Left);
          if (typeof tf.setFontSize === "function") tf.setFontSize(12);
          tf.updateAppearances(fontBold);
        } catch(e) {
          console.warn("Champ SPECIAL INSTRUCTIONS introuvable:", e?.message);
        }
      } else {
        const tf = form.getTextField(name);
        tf.setText(value);

        const isName = name.includes("NOM PRENOM");
        tf.setAlignment(isName ? PDFLib.TextAlignment.Left : PDFLib.TextAlignment.Center);

        if(def.fontSize && typeof tf.setFontSize === "function"){
          tf.setFontSize(def.fontSize);
        }

        tf.updateAppearances(fontBold);
      }

    } catch (e) {
      console.warn("Champ PDF introuvable ou incompatible:", name, e?.message || e);
    }
  }

  // ✅ Force toutes les appearances avant flatten
  form.updateFieldAppearances(fontBold);
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

  // ✅ popup SI + Poussettes pour LIR_LAUDA
  if(docKey === "LIR_LAUDA" && volTarget !== "both"){
    openLaudaModal({ docKey, volTarget });
    return;
  }

  // ✅ popup Ménage uniquement pour PRESTA_RET (Prestations arrivée)
  if(docKey === "PRESTA_RET"){
    openMenageModal({ docKey, volTarget });
    return;
  }

  // ✅ popup Prestations basé (DEP ou ARR)
  if(docKey === "PRESTA_BASE"){
    openPrestaBaseModal({ docKey, volTarget });
    return;
  }

  // ✅ popup BBCG Gate
if(docKey === "BBCG_GATE"){
  openBBCGModal({ docKey, volTarget });
  return;
}

  try {
    await fillAndPrint(docKey, volTarget);
  } catch (err) {
    console.error(err);
    alert(err?.message || String(err));
  }
});

// ===== MENAGE MODAL (Prestations arrivée) =====
let _pendingMenagePrint = null;
window._menageByVol ||= { "1": "", "2": "" }; // "" | "TIDY" | "FULL"

function setMenageUI(vol, value){
  const tidyBtn = document.getElementById(`menage${vol}TidyBtn`);
  const fullBtn = document.getElementById(`menage${vol}FullBtn`);
  if(!tidyBtn || !fullBtn) return;

  tidyBtn.classList.toggle("menage-on", value === "TIDY");
  fullBtn.classList.toggle("menage-on", value === "FULL");
}

function bindMenageButtons(){
  const bind = (vol)=>{
    const tidyBtn = document.getElementById(`menage${vol}TidyBtn`);
    const fullBtn = document.getElementById(`menage${vol}FullBtn`);
    if(!tidyBtn || !fullBtn) return;

    tidyBtn.onclick = ()=>{
      const cur = window._menageByVol[String(vol)] || "";
      window._menageByVol[String(vol)] = (cur === "TIDY") ? "" : "TIDY"; // re-clic = off
      setMenageUI(vol, window._menageByVol[String(vol)]);
    };

    fullBtn.onclick = ()=>{
      const cur = window._menageByVol[String(vol)] || "";
      window._menageByVol[String(vol)] = (cur === "FULL") ? "" : "FULL"; // re-clic = off
      setMenageUI(vol, window._menageByVol[String(vol)]);
    };
  };

  bind(1);
  bind(2);
}

function openMenageModal(pending){
  _pendingMenagePrint = pending;

  const b = document.getElementById("menageBackdrop");
  const m = document.getElementById("menageModal");

  // sync UI from saved values
  setMenageUI(1, window._menageByVol["1"] || "");
  setMenageUI(2, window._menageByVol["2"] || "");

  // Masquer les colonnes des vols vides (comme le modal Hold)
  const v1 = getVol(1);
  const v2 = getVol(2);
  const col1 = document.getElementById("menageCol1");
  const col2 = document.getElementById("menageCol2");
  if(col1) col1.style.display = isVolEmpty(v1) ? "none" : "";
  if(col2) col2.style.display = isVolEmpty(v2) ? "none" : "";

  // bind buttons (idempotent)
  bindMenageButtons();

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeMenageModal(keepPending){
  const b = document.getElementById("menageBackdrop");
  const m = document.getElementById("menageModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  if(!keepPending) _pendingMenagePrint = null;
}

async function submitMenageModal(){
  const p = _pendingMenagePrint;
  if(!p) return;

  closeMenageModal(true);
  _pendingMenagePrint = null;

  const extra = {
    menage: {
      "1": window._menageByVol["1"] || "",
      "2": window._menageByVol["2"] || "",
    }
  };

  // Pour PRESTA_BASE retour, on transmet mode + hold
  if(p.prestaMode) extra.mode = p.prestaMode;
  if(p.hold !== undefined) extra.hold = p.hold;

  await fillAndPrint(p.docKey, p.volTarget, extra);
}

window.openMenageModal = openMenageModal;
window.closeMenageModal = closeMenageModal;
window.submitMenageModal = submitMenageModal;

// ===== PRESTA BASE MODAL (choix Départ / Retour basé) =====
let _pendingPrestaBase = null;

function openPrestaBaseModal(pending){
  _pendingPrestaBase = pending;
  const b = document.getElementById("prestaBaseBackdrop");
  const m = document.getElementById("prestaBaseModal");
  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closePrestaBaseModal(){
  const b = document.getElementById("prestaBaseBackdrop");
  const m = document.getElementById("prestaBaseModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  _pendingPrestaBase = null;
}

async function submitPrestaBaseModal(mode){
  const p = _pendingPrestaBase;
  if(!p) return;
  closePrestaBaseModal();

  if(mode === "DEP"){
    // Départ basé : impression directe
    try{
      await fillAndPrint(p.docKey, p.volTarget, { mode: "DEP" });
    }catch(err){
      console.error(err);
      alert(err?.message || String(err));
    }
  } else {
    // Retour basé : d abord Hold Security Search, puis Ménage
    openHoldModal({ docKey: p.docKey, volTarget: p.volTarget, prestaMode: "ARR" });
  }
}

window.openPrestaBaseModal  = openPrestaBaseModal;
window.closePrestaBaseModal = closePrestaBaseModal;
window.submitPrestaBaseModal = submitPrestaBaseModal;

// ===== HOLD SECURITY SEARCH MODAL (Retour basé) =====
let _pendingHold = null;

function openHoldModal(pending){
  _pendingHold = pending;
  // reset les deux cases
  const cb1 = document.getElementById("holdCheckbox1");
  const cb2 = document.getElementById("holdCheckbox2");
  if(cb1) cb1.checked = false;
  if(cb2) cb2.checked = false;

  // Afficher les lignes vol selon vols remplis
  const v1 = getVol(1);
  const v2 = getVol(2);
  const row1 = document.getElementById("holdRow1");
  const row2 = document.getElementById("holdRow2");
  if(row1) row1.style.display = isVolEmpty(v1) ? "none" : "flex";
  if(row2) row2.style.display = isVolEmpty(v2) ? "none" : "flex";

  const b = document.getElementById("holdBackdrop");
  const m = document.getElementById("holdModal");
  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeHoldModal(){
  const b = document.getElementById("holdBackdrop");
  const m = document.getElementById("holdModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  _pendingHold = null;
}

function submitHoldModal(){
  const p = _pendingHold;
  if(!p) return;
  const hold = {
    "1": !!document.getElementById("holdCheckbox1")?.checked,
    "2": !!document.getElementById("holdCheckbox2")?.checked,
  };
  closeHoldModal();
  // Enchaine sur le modal Ménage, en passant hold (par vol) + prestaMode
  openMenageModal({ docKey: p.docKey, volTarget: p.volTarget, prestaMode: p.prestaMode, hold });
}

window.openHoldModal  = openHoldModal;
window.closeHoldModal = closeHoldModal;
window.submitHoldModal = submitHoldModal;

// ===== BBCG MODAL (Bingo Gate) =====
let _pendingBBCGPrint = null;

// ✅ par défaut: comp vide (le JS mettra CP1/CP3 selon A/C Type si rien choisi)
window._bbcgByVol ||= {
  "1": { gate:"", comp:"", bingoCard:"1", bingoOf:"1" },
  "2": { gate:"", comp:"", bingoCard:"1", bingoOf:"1" },
};

function defaultCompFromAcType(acType){
  const t = (acType || "").toUpperCase().trim();
  if(t === "A320" || t === "A20N") return "CP1";
  if(t === "A321" || t === "A21NY" || t === "A21N") return "CP3";
  return "";
}

function openBBCGModal(pending){
  _pendingBBCGPrint = pending;

  const vol = String(pending?.volTarget || "1");

  // sécurité si jamais la clé n’existe pas
  if(!window._bbcgByVol[vol]){
    window._bbcgByVol[vol] = { gate:"", comp:"", bingoCard:"1", bingoOf:"1" };
  }

  const data = window._bbcgByVol[vol];

  const b = document.getElementById("bbcgBackdrop");
  const m = document.getElementById("bbcgModal");

  const gate = document.getElementById("bbcgGate");
  const comp = document.getElementById("bbcgComp");
  const bc   = document.getElementById("bbcgBingoCard");
  const of   = document.getElementById("bbcgBingoOf");

  // ✅ défaut CP selon A/C type si aucun choix déjà enregistré
  const acType = document.getElementById(`dep_type_${vol}`)?.value || "";
  const compDefault = data.comp && data.comp !== ""
    ? data.comp
    : defaultCompFromAcType(acType);

  if(gate) gate.value = data.gate || "";
  if(comp) comp.value = compDefault || ""; // "" | CP1 | CP3
  if(bc)   bc.value   = data.bingoCard || "1";
  if(of)   of.value   = data.bingoOf || "1";

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";

  setTimeout(() => gate?.focus?.(), 0);
}

function closeBBCGModal(keepPending){
  const b = document.getElementById("bbcgBackdrop");
  const m = document.getElementById("bbcgModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  if(!keepPending) _pendingBBCGPrint = null;
}

async function submitBBCGModal(){
  const p = _pendingBBCGPrint;
  if(!p) return;

  const vol = String(p.volTarget || "1");

  const gate = (document.getElementById("bbcgGate")?.value || "").trim();
  const comp = (document.getElementById("bbcgComp")?.value || "").trim(); // ✅ vide autorisé

  const bingoCard = (document.getElementById("bbcgBingoCard")?.value || "1").trim();
  const bingoOf   = (document.getElementById("bbcgBingoOf")?.value || "1").trim();

  window._bbcgByVol[vol] = { gate, comp, bingoCard, bingoOf };

  closeBBCGModal(true);
  _pendingBBCGPrint = null;

  await fillAndPrint(p.docKey, p.volTarget, { gate, comp, bingoCard, bingoOf });
}

// IMPORTANT (car app.js est en module)
window.openBBCGModal = openBBCGModal;
window.closeBBCGModal = closeBBCGModal;
window.submitBBCGModal = submitBBCGModal;

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

  // Poussettes : reset à chaque ouverture
  const pPorte = document.getElementById("siModalPoussettesPorte");
  const pCBS   = document.getElementById("siModalPoussettesCBS");
  if(pPorte) pPorte.value = "";
  if(pCBS)   pCBS.value   = "";

  // Reset toggle manuel
  window._siPoussettesManuel = false;
  const btn = document.getElementById("siPoussettesManuelBtn");
  if(btn){ btn.style.opacity="0.7"; btn.style.background="none"; btn.style.borderColor="rgba(255,255,255,.25)"; btn.style.color="inherit"; }
  if(pPorte){ pPorte.disabled=false; pPorte.style.opacity="1"; }
  if(pCBS)  { pCBS.disabled=false;   pCBS.style.opacity="1"; }

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

  const siRaw = (t?.value || "");
  window._lirSiByVol[vol] = siRaw;

  // Poussettes
  let prefix = "";
  if(window._siPoussettesManuel){
    prefix = "        poussette(s) porte\n        poussette(s) soute";
  } else {
    const nPorte = parseInt(document.getElementById("siModalPoussettesPorte")?.value || "", 10);
    const nCBS   = parseInt(document.getElementById("siModalPoussettesCBS")?.value   || "", 10);
    const parts  = [];
    if(!isNaN(nPorte) && nPorte > 0)
      parts.push(nPorte === 1 ? "1 poussette porte" : `${nPorte} poussettes porte`);
    if(!isNaN(nCBS) && nCBS > 0)
      parts.push(nCBS === 1 ? "1 poussette soute" : `${nCBS} poussettes soute`);
    prefix = parts.join("\n");
  }
  const si = prefix && siRaw.trim()
    ? prefix + "\n" + siRaw.trim()
    : prefix || siRaw.trim();

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

/* ========= LAUDA MODAL (SI + Poussettes) ========= */

let _pendingLaudaPrint = null;
window._laudaSiByVol = { "1": "", "2": "" };

function openLaudaModal(pending){
  _pendingLaudaPrint = pending;
  const vol = String(pending?.volTarget || "1");

  const b = document.getElementById("laudaBackdrop");
  const m = document.getElementById("laudaModal");
  const t = document.getElementById("laudaModalInput");
  const pPorte = document.getElementById("laudaModalPoussettesPorte");
  const pCBS   = document.getElementById("laudaModalPoussettesCBS");

  if(t){ t.value = window._laudaSiByVol[vol] || ""; setTimeout(()=> t.focus(), 0); }
  if(pPorte) pPorte.value = "";
  if(pCBS)   pCBS.value   = "";

  if(b) b.style.display = "block";
  if(m) m.style.display = "flex";
}

function closeLaudaModal(keepPending){
  const b = document.getElementById("laudaBackdrop");
  const m = document.getElementById("laudaModal");
  if(b) b.style.display = "none";
  if(m) m.style.display = "none";
  if(!keepPending) _pendingLaudaPrint = null;
}

async function submitLaudaModal(){
  const t = document.getElementById("laudaModalInput");
  const p = _pendingLaudaPrint;
  if(!p) return;

  const vol = String(p.volTarget || "1");
  const siRaw = (t?.value || "");
  window._laudaSiByVol[vol] = siRaw;

  const nPorte = parseInt(document.getElementById("laudaModalPoussettesPorte")?.value || "", 10);
  const nCBS   = parseInt(document.getElementById("laudaModalPoussettesCBS")?.value   || "", 10);
  const parts  = [];
  if(!isNaN(nPorte) && nPorte > 0)
    parts.push(nPorte === 1 ? "1 poussette porte" : `${nPorte} poussettes porte`);
  if(!isNaN(nCBS) && nCBS > 0)
    parts.push(nCBS === 1 ? "1 poussette soute" : `${nCBS} poussettes soute`);
  const prefix = parts.join("\n");

  const si = prefix && siRaw.trim()
    ? prefix + "\n" + siRaw.trim()
    : prefix || siRaw.trim();

  closeLaudaModal(true);
  _pendingLaudaPrint = null;

  await fillAndPrint(p.docKey, p.volTarget, { si });
}

window.openLaudaModal  = openLaudaModal;
window.closeLaudaModal = closeLaudaModal;
window.submitLaudaModal = submitLaudaModal;

// ===== POUSSETTES MANUEL TOGGLE =====
window._siPoussettesManuel = false;

window.togglePoussettesManuel = function togglePoussettesManuel(){
  const chk    = document.getElementById("siPoussettesManuelBtn");
  const on     = chk ? chk.checked : (window._siPoussettesManuel = !window._siPoussettesManuel);
  window._siPoussettesManuel = on;

  const pPorte = document.getElementById("siModalPoussettesPorte");
  const pCBS   = document.getElementById("siModalPoussettesCBS");

  if(pPorte){ pPorte.disabled = on; pPorte.style.opacity = on ? ".35" : "1"; }
  if(pCBS)  { pCBS.disabled   = on; pCBS.style.opacity   = on ? ".35" : "1"; }
};

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
  if(h) h.style.display = "none";

  const v = (i?.value || "").trim();
  window._rzaName = v; // peut être vide

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

const AK_API_URL = "/ak";
// Proxy Cloudflare Pages Function — le token est géré côté serveur
const AK_AIRPORT = "LFOB";

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
    `${AK_API_URL}?airport=${encodeURIComponent(AK_AIRPORT)}` +
    `&flow=${encodeURIComponent(flow)}` +
    `&from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}`;

  const res = await fetch(url);
  if(!res.ok) throw new Error(`AK error ${res.status} (url=${url})`);

  const data = await res.json();
  if(Array.isArray(data)) return data;
  if(Array.isArray(data?.flights)) return data.flights;
  if(Array.isArray(data?.data)) return data.data;

  console.log("AK payload inconnu:", data);
  return [];
}

let _useUTC = false;

// ===== stockage des timestamps SIBT/SOBT pour refresh UTC/LT =====
const _sibtMs = { "1": null, "2": null };
const _sobtMs = { "1": null, "2": null };

function refreshSibtSobtDisplay(){
  for(const n of ["1","2"]){
    const sibtEl = document.getElementById(`sibt_display_${n}`);
    const sobtEl = document.getElementById(`sobt_display_${n}`);
    if(sibtEl) sibtEl.textContent = Number.isFinite(_sibtMs[n]) ? `SIBT ${hhmmFromMs(_sibtMs[n])}` : "";
    if(sobtEl) sobtEl.textContent = Number.isFinite(_sobtMs[n]) ? `SOBT ${hhmmFromMs(_sobtMs[n])}` : "";
  }
}

function hhmmFromMs(ms){
  if(ms == null) return "--:--";
  const d  = new Date(ms);
  const hh = String(_useUTC ? d.getUTCHours()   : d.getHours())  .padStart(2,"0");
  const mm = String(_useUTC ? d.getUTCMinutes()  : d.getMinutes()).padStart(2,"0");
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

function getDepDelay(f){
  const sobt = Date.parse(f?.sobt || '');
  const eobt = Date.parse(f?.eobt || '');
  if(!Number.isFinite(sobt) || !Number.isFinite(eobt)) return 0;
  return Math.round((eobt - sobt) / 60000);
}

function getArrDelay(f){
  const sibt = Date.parse(f?.sibt || '');
  const eibt = Date.parse(f?.eibt || '');
  if(!Number.isFinite(sibt) || !Number.isFinite(eibt)) return 0;
  return Math.round((eibt - sibt) / 60000);
}

function getDepStatus(f){
  const lid = String(f?.linkedId || "").trim();
  const arr = lid ? (window._akArrAll || []).find(a => String(a?.id || "") === lid) : null;
  const arrived  = Number.isFinite(Date.parse(arr?.aibt || ""));
  const departed = Number.isFinite(Date.parse(f?.atot || ""));
  if(departed) return "DÉCOLLÉ";
  if(arrived)  return "ARRIVÉ";
  return "";
}

function getArrStatus(f){
  const arrived  = Number.isFinite(Date.parse(f?.aibt || ""));
  const lid = String(f?.linkedId || "").trim();
  const dep = lid ? (window._akDepById?.get(lid) || null) : null;
  const departed = Number.isFinite(Date.parse(dep?.atot || ""));
  if(departed) return "DÉCOLLÉ";
  if(arrived)  return "ARRIVÉ";
  return "";
}

function buildDepLabel(f){
  const t     = hhmmFromMs(depListMs(f));
  const flt   = upper(f?.fullFlightNumber || f?.callsign || "");
  const to    = upper(f?.adesIata || f?.adesIcao || "");
  const regRaw= upper(f?.reg || "");
  const reg   = regRaw || "-----";
  const stand = (f?.pkg || "").toString().replace(/^P/i,"").trim();
  const p     = stand ? `P${stand}` : "";

  // ✅ ARRIVÉ si AIBT connu sur l’arrivée liée
  const lid = String(f?.linkedId || "").trim();
  const arr = lid
    ? (window._akArrAll || []).find(a => String(a?.id || "") === lid)
    : null;
  const arrived = Number.isFinite(Date.parse(arr?.aibt || ""));

  // ✅ DÉCOLLÉ si ATOT connu
  const departed = Number.isFinite(Date.parse(f?.atot || ""));

  // priorité au statut DÉCOLLÉ
  let status = "";
  if(departed){
    status = "DÉCOLLÉ";
  } else if(arrived){
    status = "ARRIVÉ";
  }

  const parts = [t || "--:--", flt || "—", to || "", reg, p].filter(Boolean);
  const base  = parts.join("  ·  ");
  return base + (status ? "  —  " + status : "");
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

  const parts = [t || "--:--", flt || "—", from || "", reg, p].filter(Boolean);
  const base  = parts.join("  ·  ");
  return base + (status ? "  —  " + status : "");
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

  // Meme avion : pre-remplit les champs visibles Registration + A/C Type
  // (seront ecrases si un DEP lie est trouve via applyDepOnlyToVol)
  const regVal  = upper(arr?.reg || "");
  const typeVal = akAcType(arr);
  if(regVal)  setVal(`dep_reg_${n}`,  regVal);
  if(typeVal) setVal(`dep_type_${n}`, typeVal);

  const stand = (arr?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);

  // SIBT
  const sibtMs = Date.parse(arr?.sibt || "");
  _sibtMs[String(n)] = Number.isFinite(sibtMs) ? sibtMs : null;
  const sibtEl = document.getElementById(`sibt_display_${n}`);
  if(sibtEl) sibtEl.textContent = Number.isFinite(sibtMs) ? `SIBT ${hhmmFromMs(sibtMs)}` : "";
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

  // SOBT
  const sobtMs = Date.parse(dep?.sobt || "");
  _sobtMs[String(n)] = Number.isFinite(sobtMs) ? sobtMs : null;
  const sobtEl = document.getElementById(`sobt_display_${n}`);
  if(sobtEl) sobtEl.textContent = Number.isFinite(sobtMs) ? `SOBT ${hhmmFromMs(sobtMs)}` : "";
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

  // SOBT
  const sobtMs = Date.parse(dep?.sobt || "");
  _sobtMs[String(n)] = Number.isFinite(sobtMs) ? sobtMs : null;
  const sobtEl = document.getElementById(`sobt_display_${n}`);
  if(sobtEl) sobtEl.textContent = Number.isFinite(sobtMs) ? `SOBT ${hhmmFromMs(sobtMs)}` : "";

  // ===== ARRIVEE liée (linkedId + même jour obligatoire) =====
  const prevArr = findLinkedArrForDepSameDay(dep, arrAll);

  if(prevArr){
    const arrIso = prevArr?.sibt || prevArr?.eibt || prevArr?.aibt || prevArr?.aldt || prevArr?.eldt || prevArr?.afat || prevArr?.efat || "";
    setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));

    setVal(`arr_flt_${n}`, upper(prevArr?.fullFlightNumber || prevArr?.callsign || ""));
    setVal(`arr_from_${n}`, upper(prevArr?.adepIata || prevArr?.adepIcao || ""));
    setVal(`arr_reg_${n}`, upper(prevArr?.reg || dep?.reg || ""));
    setVal(`arr_type_${n}`, akAcType(prevArr) || akAcType(dep));

    // SIBT de l'arrivée liée
    const sibtMs = Date.parse(prevArr?.sibt || "");
    _sibtMs[String(n)] = Number.isFinite(sibtMs) ? sibtMs : null;
    const sibtEl = document.getElementById(`sibt_display_${n}`);
    if(sibtEl) sibtEl.textContent = Number.isFinite(sibtMs) ? `SIBT ${hhmmFromMs(sibtMs)}` : "";
  } else {
    // si pas de liée (ou pas le même jour), on ne remplit pas l'arrivée
    setVal(`arr_reg_${n}`, "");
    setVal(`arr_type_${n}`, "");
    setVal(`arr_date_${n}`, "");
    setVal(`arr_flt_${n}`, "");
    setVal(`arr_from_${n}`, "");
    const sibtEl = document.getElementById(`sibt_display_${n}`);
    if(sibtEl) sibtEl.textContent = "";
    _sibtMs[String(n)] = null;
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

  const sibtEl = document.getElementById(`sibt_display_${volNum}`);
  const sobtEl = document.getElementById(`sobt_display_${volNum}`);
  if(sibtEl) sibtEl.textContent = "";
  if(sobtEl) sobtEl.textContent = "";
  _sibtMs[String(volNum)] = null;
  _sobtMs[String(volNum)] = null;
}

/* =========================
   BADGES RETARD (UI)
   ========================= */

const EIBT_CORRECTION_MIN = -4; // ✅ corrige EIBT (souvent ELDT+10) -> on réduit le taxi-in

function addMinutesToIso(iso, minutes){
  const t = Date.parse(iso || "");
  if(!Number.isFinite(t)) return "";
  return new Date(t + minutes * 60000).toISOString();
}

function delayMinFrom(plannedIso, actualIso){
  const p = Date.parse(plannedIso || "");
  const a = Date.parse(actualIso || "");
  if(!Number.isFinite(p) || !Number.isFinite(a)) return null;
  return Math.round((a - p) / 60000);
}

function actualDepIso(f){
  // départ : AOBT > EOBT
  return f?.aobt || f?.eobt || "";
}

function actualArrIso(f){
  // arrivée : on veut DU BLOC
  // AIBT (réel) > EIBT (estimé en vol, corrigé)
  if(f?.aibt) return f.aibt;

  if(f?.eibt){
    // ✅ on réduit l'estimation (taxi-in trop long côté API)
    return addMinutesToIso(f.eibt, EIBT_CORRECTION_MIN);
  }

  return "";
}

function renderDelayBadge(containerEl, mins){
  if(!containerEl || mins == null) return;

  let label = "";
  let color = "";

  if(mins >= 15){
    label = `RETARDÉ +${mins}`;
    color = "is-danger";
  }
  else if(mins >= 6){
    label = `RETARDÉ +${mins}`;
    color = "is-warning";
  }
  else if(mins <= -11){
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
    const actual  = actualArrIso(arrFlight); // ✅ AIBT ou EIBT corrigé
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

function startAKAutoRefresh(){
  setInterval(async ()=>{
    try{
      await loadAKAll();
    }catch(e){
      const msg = String(e?.message || e);
      // si réseau / redirect / session cassée → reload = comme F5
      if(/failed to fetch|network error|fetch/i.test(msg)){
        window.location.reload();
        return;
      }
      console.warn("Auto-refresh AK:", e);
    }
  }, 15 * 60 * 1000);
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
    opt.dataset.status = (flow === "DEP") ? getDepStatus(f) : getArrStatus(f);
    const _delay = (flow === "DEP") ? getDepDelay(f) : getArrDelay(f);
    opt.dataset.delay = _delay > 15 ? _delay : 0;
    sel.appendChild(opt);
  }

  if(st) st.textContent = `${list.length} vol(s)`;
  window.syncCustomDrop?.(n);
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
// Précharge tous les templates PDF en mémoire au démarrage
// => les clics ne font plus jamais de requête réseau
async function preloadAllTemplates(){
  const BASE = new URL("./", location.href).toString();

  // Précharge la font aussi
  try{
    await getFontsBytes(BASE);
  }catch(e){
    console.warn("Préchargement font échoué (réessai au 1er clic):", e?.message);
  }

  for(const [key, def] of Object.entries(DOCS)){
    if(!def.file) continue;
    if(_templateCache.has(key)) continue;
    try{
      const bytes = await fetchArrayBufferRetry(def.file, key, 2, 300);
      if(bytes && bytes.byteLength > 0){
        _templateCache.set(key, bytes);
        console.log("✅ Template en cache :", key);
      }
    }catch(e){
      console.warn("⚠ Préchargement échoué pour", key, "— sera réessayé au clic :", e?.message);
    }
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  bindAK(1);
  bindAK(2);
  loadAKAll();
  startAKAutoRefresh();

  // Précharge tous les PDFs en arrière-plan dès le chargement
  preloadAllTemplates();

  // Fermer les popups avec Échap + valider avec Entrée
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      if(document.getElementById("siBackdrop")?.style.display          !== "none") { closeSIModal(false);        return; }
      if(document.getElementById("laudaBackdrop")?.style.display        !== "none") { closeLaudaModal(false);     return; }
      if(document.getElementById("rzaBackdrop")?.style.display         !== "none") { closeRZAModal(false);       return; }
      if(document.getElementById("bbcgBackdrop")?.style.display        !== "none") { closeBBCGModal(false);      return; }
      if(document.getElementById("menageBackdrop")?.style.display      !== "none") { closeMenageModal(false);    return; }
      if(document.getElementById("prestaBaseBackdrop")?.style.display  !== "none") { closePrestaBaseModal();     return; }
      if(document.getElementById("holdBackdrop")?.style.display        !== "none") { closeHoldModal();           return; }
      if(document.getElementById("akBackdrop")?.style.display          !== "none") { closeAKMenu();              return; }
    }
    if(e.key === "Enter"){
      // Ne pas intercepter si on est dans un textarea
      if(e.target.tagName === "TEXTAREA") return;
      if(document.getElementById("siBackdrop")?.style.display          !== "none") { e.preventDefault(); submitSIModal();        return; }
      if(document.getElementById("laudaBackdrop")?.style.display        !== "none") { e.preventDefault(); submitLaudaModal();     return; }
      if(document.getElementById("rzaBackdrop")?.style.display         !== "none") { e.preventDefault(); submitRZAModal();       return; }
      if(document.getElementById("bbcgBackdrop")?.style.display        !== "none") { e.preventDefault(); submitBBCGModal();      return; }
      if(document.getElementById("menageBackdrop")?.style.display      !== "none") { e.preventDefault(); submitMenageModal();    return; }
      if(document.getElementById("prestaBaseBackdrop")?.style.display  !== "none") { e.preventDefault(); submitPrestaBaseModal(); return; }
      if(document.getElementById("holdBackdrop")?.style.display        !== "none") { e.preventDefault(); submitHoldModal();      return; }
    }
  });

  // Toggle UTC / Local
  const utcBtn = document.getElementById("utcToggle");
  if(utcBtn){
    utcBtn.addEventListener("click", ()=>{
      _useUTC = !_useUTC;
      utcBtn.title = _useUTC ? "Mode UTC — cliquer pour Local" : "Mode Local — cliquer pour UTC";
      const badge = document.getElementById("utcBadge");
      if(badge) badge.textContent = _useUTC ? "UTC" : "LT";
      refreshAKDropdown(1);
      refreshAKDropdown(2);
      refreshSibtSobtDisplay();
    });
  }
});

/* ================================================
   EXPOSITION GLOBALE — clearVolCard
   ================================================ */
window.clearVolCard = function(n) {
  clearBadges(n);
  resetVolUI(n);
  // Reset native select + custom dropdown
  const sel = document.getElementById('ak_flight_' + n);
  if (sel) sel.value = '';
  const valEl = document.getElementById('cvd_val_' + n);
  if (valEl) {
    valEl.textContent = '— Choisir un vol —';
    valEl.classList.add('placeholder');
  }
  // Deselect all options in custom panel
  const panel = document.getElementById('cvd_panel_' + n);
  if (panel) {
    panel.querySelectorAll('.cvd-opt').forEach(o => o.classList.remove('selected'));
  }
};
