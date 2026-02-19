import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit";

const TEMPLATE_BASE = "https://flight-templates.deruellehugo-49c.workers.dev";
const { PDFDocument, StandardFonts } = PDFLib;

function isoToDDMMYYYY(iso){
  if(!iso) return "";
  const [y,m,d]=iso.split("-");
  return `${d}/${m}/${y}`;
}

function upper(s){ return (s||"").toUpperCase().trim(); }

function getVol(n){
  const g=id=>document.getElementById(`${id}_${n}`)?.value||"";
  const c=id=>!!document.getElementById(`${id}_${n}`)?.checked;

  return {
    arr:{
      date:g("arr_date"),
      flt:g("arr_flt"),
      from:g("arr_from"),
      reg:g("arr_reg"),
      type:g("arr_type"),
      hold_search: c("hold_search")
    },
    dep:{
      date:g("dep_date"),
      flt:g("dep_flt"),
      to:g("dep_to"),
      reg:g("dep_reg"),
      type:g("dep_type")
    }
  }
}

function isVolEmpty(v){
  return !v.arr.date&&!v.arr.flt&&!v.dep.date&&!v.dep.flt;
}

function parking(n){ return document.getElementById(`parking_${n}`)?.value||"" }
function agent(){ return upper(document.getElementById("full_name")?.value) }

const DOCS={

/* ========= BINGO ========= */

BINGO_FR:{
 file: `${TEMPLATE_BASE}/templates/BINGO.pdf`,
 fill:({vol1})=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "REGISTRATION": vol1.dep.reg,
   "TO": vol1.dep.to,
   "Agent": agent()
 }),
 flatten:true
},

/* ========= LIR RYANAIR ========= */

LIR_RYANAIR:{
  file: `${TEMPLATE_BASE}/templates/LIR RYANAIR BELLOVA.pdf`,
  fill:({vol1})=>{
    const x = lirTypeX(vol1.dep.type); // A/C Type UI (ICAO)

    return {
      "DATE": isoToDDMMYYYY(vol1.dep.date),
      "REGISTRATION": vol1.dep.reg,
      "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
      "TO": vol1.dep.to,

      "A/C TYPE": vol1.dep.type,

      // ✅ met "X" dans les 2 autres cases
      "B737": x.B737,
      "B738": x.B738,
      "B38M": x.B38M,

      "ARRIVAL FLIGHT NUMBER": vol1.arr.flt || "",
      "HOLD SECURITY SEARCH": !!vol1.arr.hold_search,

      "POUSSETTE PORTE": "",
      "POUSSETTE CBS": "",
      "MAX 5": "",
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
   const o={},name=agent();

   if(!isVolEmpty(vol1)){
     o["FLIGHT A - DEPARTURE FLIGHT NUMBER"] = vol1.dep.flt;
     o["FLIGHT A - DATE"] = isoToDDMMYYYY(vol1.dep.date);
     o["FLIGHT A - TO"] = vol1.dep.to;
     o["VOL A - NOM PRENOM"] = name;
   }

   if(!isVolEmpty(vol2)){
     o["FLIGHT B - DEPARTURE FLIGHT NUMBER"] = vol2.dep.flt;
     o["FLIGHT B - DATE"] = isoToDDMMYYYY(vol2.dep.date);
     o["FLIGHT B - TO"] = vol2.dep.to;
     o["VOL B - NOM PRENOM"] = name;
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

async function fillAndPrint(docKey, volTarget = "1") {
  const def = DOCS[docKey];
  if (!def) return;

  const v1 = getVol(1), v2 = getVol(2);
  const vol1 = (volTarget === "2") ? v2 : v1;
  const vol2 = (volTarget === "2") ? v1 : v2;

  const res = await fetch(def.file);
  if (!res.ok) throw new Error(`Template fetch failed (${res.status})`);

  const pdfDoc = await PDFDocument.load(await res.arrayBuffer());
  pdfDoc.registerFontkit(fontkit);

  const form = pdfDoc.getForm();

  // ✅ chemin compatible GitHub Pages + local
  const BASE = location.pathname.replace(/\/[^\/]*$/, "/");

  const arialBytes = await fetch(BASE + "fonts/ARIAL.TTF").then(r => r.arrayBuffer());
  const arialBoldBytes = await fetch(BASE + "fonts/ARIAL-BOLD.TTF").then(r => r.arrayBuffer());

  const font = await pdfDoc.embedFont(arialBytes);
  const fontBold = await pdfDoc.embedFont(arialBoldBytes);

  const fields =
    (volTarget === "both")
      ? def.fill({ vol1: v1, vol2: v2 })
      : def.fill({ vol1, vol2 });

  for (const [name, raw] of Object.entries(fields)) {
    try {
      // 1) bool -> checkbox
      if (typeof raw === "boolean") {
        const cb = form.getCheckBox(name);
        raw ? cb.check() : cb.uncheck();
        continue;
      }

      const value = String(raw ?? "").toUpperCase();

      // 2) Si le champ est une checkbox (cas fréquent pour les "cases")
      //    et qu’on veut mettre "X" => on coche.
      try {
        const cb = form.getCheckBox(name);
        if (value === "X") cb.check();
        else cb.uncheck();
        continue; // si ça a marché, on ne traite pas en TextField
      } catch {}

      // 3) Sinon c’est un TextField : on écrit en Arial / Arial Bold
      const tf = form.getTextField(name);
      tf.setText(value);

      const isName = name.includes("NOM PRENOM");
      tf.setAlignment(isName ? PDFLib.TextAlignment.Left : PDFLib.TextAlignment.Center);

      // ✅ Arial pour tout, Arial Bold pour "X"
      tf.updateAppearances(value === "X" ? fontBold : font);

    } catch (e) {
      // champ absent dans ce template -> on ignore sans casser
      console.warn("Champ PDF introuvable ou incompatible:", name);
    }
  }

  form.flatten();

  const bytes = await pdfDoc.save();
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => iframe.contentWindow.print();
}


// ===== boutons PDF =====
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-doc]");
  if (!b) return;

  try {
    await fillAndPrint(b.dataset.doc, b.dataset.vol || "1");
  } catch (err) {
    console.error(err);
    alert(err?.message || String(err));
  }
});

function lirTypeX(acType){
  const t = upper(acType);

  // on ne garde que ces 3 valeurs
  // (si tu veux gérer d'autres variantes, je te l'étends)
  const isB737 = t === "B737";
  const isB738 = t === "B738";
  const isB38M = t === "B38M";

  return {
    B737: (isB737 ? "" : "X"),
    B738: (isB738 ? "" : "X"),
    B38M: (isB38M ? "" : "X"),
  };
}

/* =========================
   AirportKeeper -> Dropdowns
   - Liste DEP = SOBT
   - Liste ARR = SIBT
   - Lien ARR↔DEP conservé (via arrAll)
   - Badges UI : ARR et DEP indépendants
     * 5–14  => retard orange
     * >=15  => retard rouge
     * <5    => à l'heure vert
     * <=-5  => en avance bleu
   ========================= */

const AK_PROXY = "https://airportkeeper-proxy.deruellehugo-49c.workers.dev/ak";

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

// ===== temps "moteur" (pour lien, etc.) =====
function arrTimeMs(f){
  return Date.parse(f?.aibt || f?.eibt || f?.sibt || f?.aldt || f?.eldt || f?.afat || f?.efat || '') || null;
}
function depTimeMs(f){
  return Date.parse(f?.aobt || f?.eobt || f?.pobt || f?.ctot || f?.etot || f?.sobt || '') || null;
}

// ===== temps "LISTE" (affichage + tri du menu) =====
// ✅ DEP affiché = SOBT
function depListMs(f){
  return Date.parse(f?.sobt || "") || null;
}
// ✅ ARR affiché = SIBT
function arrListMs(f){
  return Date.parse(f?.sibt || "") || null;
}

async function fetchAK(flow, from, to){
  const url =
    `${AK_PROXY}?flow=${encodeURIComponent(flow)}` +
    `&from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}`;

  const res = await fetch(url);
  if(!res.ok) throw new Error(`AK error ${res.status}`);

  const data = await res.json();

  // ✅ accepte tous les formats possibles
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.flights)) return data.flights;
  if (Array.isArray(data?.data)) return data.data;

  console.log("AK payload inconnu:", data);
  return [];
}

// label dropdown (simple + fiable)
function hhmmFromMs(ms){
  if(ms == null) return "--:--";
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${hh}:${mm}`;
}

function buildDepLabel(f){
  const t   = hhmmFromMs(depListMs(f)); // ✅ SOBT
  const ff  = upper(f?.fullFlightNumber || f?.callsign || "");
  const to  = upper(f?.adesIata || f?.adesIcao || "");
  const reg = upper(f?.reg || "");
  const stand = (f?.pkg || "").toString().replace(/^P/i,"").trim();
  return `${t || "—"} ${ff || "(sans numéro)"} → ${to || "---"} (${reg || "REG?"}${stand ? ` · P${stand}` : ""})`;
}

function buildArrLabel(f){
  const t   = hhmmFromMs(arrListMs(f)); // ✅ SIBT
  const ff  = upper(f?.fullFlightNumber || f?.callsign || "");
  const from= upper(f?.adepIata || f?.adepIcao || "");
  const reg = upper(f?.reg || "");
  const stand = (f?.pkg || "").toString().replace(/^P/i,"").trim();
  return `${t || "—"} ${ff || "(sans numéro)"} ← ${from || "---"} (${reg || "REG?"}${stand ? ` · P${stand}` : ""})`;
}

function setVal(id, v){
  const el = $(id);
  if(!el) return;
  el.value = (v ?? "");
  el.dispatchEvent(new Event("input", {bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
}

// trouve l'arrivée précédente même reg (fenêtre 18h)
function findPrevArrForDep(dep, arrAll){
  const depT = depTimeMs(dep);
  if(depT == null) return null;
  const reg = upper(dep?.reg || "");
  if(!reg) return null;

  let best = null;
  let bestDt = Infinity;

  for(const a of (arrAll || [])){
    if(upper(a?.reg || "") !== reg) continue;
    const aT = arrTimeMs(a);
    if(aT == null) continue;
    if(aT > depT) continue;

    const dt = depT - aT;
    if(dt < 0) continue;
    if(dt > 18*60*60*1000) continue;

    if(dt < bestDt){
      best = a;
      bestDt = dt;
    }
  }
  return best;
}

function applyDepToVol(n, dep, arrAll){
  if(!dep) return;

  // ===== DEPART =====
  const depIso = dep?.sobt || dep?.eobt || dep?.aobt || dep?.pobt || dep?.ctot || dep?.etot || dep?.atot || "";
  setVal(`dep_date_${n}`, isoToYYYYMMDD(depIso));

  setVal(`dep_flt_${n}`, upper(dep?.fullFlightNumber || dep?.callsign || ""));
  setVal(`dep_to_${n}`, upper(dep?.adesIata || dep?.adesIcao || ""));
  setVal(`dep_reg_${n}`, upper(dep?.reg || ""));
  setVal(`dep_type_${n}`, akAcType(dep)); // ← A/C TYPE DEP

  const stand = (dep?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);

  // ===== ARRIVEE liée =====
  const prevArr = findPrevArrForDep(dep, arrAll);

  if(prevArr){
    const arrIso = prevArr?.sibt || prevArr?.eibt || prevArr?.aibt || prevArr?.aldt || prevArr?.eldt || prevArr?.afat || prevArr?.efat || "";
    setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));

    setVal(`arr_flt_${n}`, upper(prevArr?.fullFlightNumber || prevArr?.callsign || ""));
    setVal(`arr_from_${n}`, upper(prevArr?.adepIata || prevArr?.adepIcao || ""));
    setVal(`arr_reg_${n}`, upper(prevArr?.reg || dep?.reg || ""));
    setVal(`arr_type_${n}`, akAcType(prevArr) || akAcType(dep)); // ← A/C TYPE ARR
  } else {
    // fallback si pas d’arrivée trouvée
    setVal(`arr_reg_${n}`, upper(dep?.reg || ""));
    setVal(`arr_type_${n}`, akAcType(dep));
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
   BADGES RETARD (UI)
   ========================= */

function delayMinFrom(plannedIso, actualIso){
  const p = Date.parse(plannedIso || "");
  const a = Date.parse(actualIso || "");
  if(!p || !a) return null;
  return Math.round((a - p) / 60000);
}

function actualDepIso(f){
  return f?.aobt || f?.atot || f?.eobt || f?.etot || f?.pobt || f?.ctot || "";
}
function actualArrIso(f){
  return f?.aibt || f?.aldt || f?.eibt || f?.eldt || f?.afat || f?.efat || "";
}

// ✅ règles demandées
function renderDelayBadge(containerEl, mins){
  if(!containerEl || mins == null) return;

  let label = "";
  let color = "";

  if(mins >= 15){
    label = `RETARD +${mins}`;
    color = "is-danger";     // rouge
  }
  else if(mins >= 5){
    label = `RETARD +${mins}`;
    color = "is-warning";    // orange
  }
  else if(mins <= -5){
    label = `EN AVANCE ${mins}`; // ex: -8
    color = "is-info";       // bleu
  }
  else{
    label = "À L’HEURE";
    color = "is-success";    // vert
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

  // DEP: SOBT vs actualDep
  if(depFlight && depWrap){
    const planned = depFlight?.sobt || "";
    const actual  = actualDepIso(depFlight);
    renderDelayBadge(depWrap, delayMinFrom(planned, actual));
  }

  // ARR: SIBT vs actualArr
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
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
  const endDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);

  // fenêtre large pour lier ARR ↔ DEP
  const linkFromDate = new Date(startDay.getTime() - 12*60*60*1000);
  const linkToDate   = new Date(endDay.getTime()   + 12*60*60*1000);
  const linkFrom = linkFromDate.toISOString().replace(/\.\d{3}Z$/, "Z");
  const linkTo   = linkToDate.toISOString().replace(/\.\d{3}Z$/, "Z");

  try{
    const [arrAll, depAll] = await Promise.all([
      fetchAK("ARR", linkFrom, linkTo),
      fetchAK("DEP", linkFrom, linkTo),
    ]);

    // ✅ vols départ du jour : basé sur SOBT uniquement
    const inTodayDep = (f)=>{
      const t = Date.parse(f?.sobt || "");
      return t && t >= startDay.getTime() && t <= endDay.getTime();
    };
    const depToday = depAll.filter(inTodayDep);

    // ✅ vols arrivée du jour : basé sur SIBT uniquement
    const inTodayArr = (f)=>{
      const t = Date.parse(f?.sibt || "");
      return t && t >= startDay.getTime() && t <= endDay.getTime();
    };
    const arrToday = arrAll.filter(inTodayArr);

    // ✅ tri chrono SOBT / SIBT (liste)
    depToday.sort((a,b)=> (Date.parse(a?.sobt || "") || 1e18) - (Date.parse(b?.sobt || "") || 1e18));
    arrToday.sort((a,b)=> (Date.parse(a?.sibt || "") || 1e18) - (Date.parse(b?.sibt || "") || 1e18));

    // cache global
    window._akArrAll   = arrAll;     // large window, utile pour lien
    window._akDepAll   = depAll;     // si besoin plus tard
    window._akDepToday = depToday;   // pour affichage DEP
    window._akArrToday = arrToday;   // pour affichage ARR

    // refresh dropdowns selon le flow sélectionné
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
  });

  sel.addEventListener("change", ()=>{
    const id = sel.value;
    if(!id){
      clearBadges(n);
      return;
    }

    const flow = flowSel.value;

    if(flow === "DEP"){
      const dep = (window._akDepToday || []).find(f => String(f?.id ?? "") === String(id));
      if(!dep) return;

      applyDepToVol(n, dep, window._akArrAll || []);

      const prevArr = findPrevArrForDep(dep, window._akArrAll || []);
      updateBadgesFromFlights(n, dep, prevArr);

    } else {
      const arr = (window._akArrToday || []).find(f => String(f?.id ?? "") === String(id));
      if(!arr) return;

      const arrIso = arr?.sibt || arr?.eibt || arr?.aibt || arr?.aldt || arr?.eldt || arr?.afat || arr?.efat || "";
      setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));
      setVal(`arr_flt_${n}`, upper(arr?.fullFlightNumber || arr?.callsign || ""));
      setVal(`arr_from_${n}`, upper(arr?.adepIata || arr?.adepIcao || ""));
      setVal(`arr_reg_${n}`, upper(arr?.reg || ""));
      setVal(`arr_type_${n}`, akAcType(arr));

      updateBadgesFromFlights(n, null, arr);
    }
  });
}

// boot
document.addEventListener("DOMContentLoaded", ()=>{
  bindAK(1);
  bindAK(2);
  loadAKAll();
});
