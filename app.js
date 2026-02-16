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
      hold_search: c("hold_search") // checkbox HOLD SECURITY SEARCH
    },
    dep:{
      date:g("dep_date"),
      flt:g("dep_flt"),
      to:g("dep_to"),
      reg:g("dep_reg")
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
 file:"./templates/BINGO.pdf",
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
 file:"./templates/LIR RYANAIR BELLOVA.pdf",
 fill:({vol1})=>({
   "DATE": isoToDDMMYYYY(vol1.dep.date),
   "REGISTRATION": vol1.dep.reg,
   "DEPARTURE FLIGHT NUMBER": vol1.dep.flt,
   "TO": vol1.dep.to,
   "ARRIVAL FLIGHT NUMBER": vol1.arr.flt || "",
   "HOLD SECURITY SEARCH": !!vol1.arr.hold_search // HOLD SECURITY SEARCH
 }),
 flatten:true
},

/* ========= LIR LAUDA ========= */

LIR_LAUDA:{
 file:"./templates/lauda-lir.pdf",
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
 file:"./templates/BBCG_Apr2020_Rev1 - BAGGAGE BINGO CARD_GATE.pdf",
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
 file:"./templates/WAIF_Jun2021_Rev1.1_ WALKAROUND INSPECTION FORM.pdf",
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
 file:"./templates/RTB_Mar2025_Rev3_Ready To Board.pdf",
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
 file:"./templates/Autocontrôle.pdf",
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
 file:"./templates/Suivi prestations basés départ.pdf",
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
 file:"./templates/Suivi prestations basés arrivée.pdf",
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

/* ---------- MOTEUR PDF ---------- */

const STYLE = {
  DEFAULT: { fontSize: 14, lineHeight: 14 },
  AUTOCONTROLE: { fontSize: 14, lineHeight: 13 },
  WAIF: { fontSize: 14, lineHeight: 13 },
  PRESTA_DEP: { fontSize: 14, lineHeight: 14 },
  PRESTA_RET: { fontSize: 14, lineHeight: 14 },
};

function getStyle(docKey, fieldName){
  const base = STYLE.DEFAULT;
  const doc = STYLE[docKey] || {};
  const s = {
    fontSize: doc.fontSize ?? base.fontSize,
    lineHeight: doc.lineHeight ?? base.lineHeight
  };

  if(fieldName.includes("NOM PRENOM")){
    s.lineHeight = s.fontSize + 2;
  }

  return s;
}

async function fillAndPrint(docKey,volTarget="1"){
 const def=DOCS[docKey]; if(!def)return;
 const v1=getVol(1),v2=getVol(2);
 const vol1=(volTarget==="2")?v2:v1;
 const vol2=(volTarget==="2")?v1:v2;

 const res=await fetch(def.file);
 const pdfDoc=await PDFDocument.load(await res.arrayBuffer());
 const form=pdfDoc.getForm();
 const font=await pdfDoc.embedFont(StandardFonts.Helvetica);

 const fields=(volTarget==="both")?def.fill({vol1:v1,vol2:v2}):def.fill({vol1,vol2});

 for(const [n,v] of Object.entries(fields)){
   try{
     if(typeof v==="boolean"){
       const cb=form.getCheckBox(n);
       v?cb.check():cb.uncheck();
       continue;
     }

     const tf=form.getTextField(n);
     tf.setText(String(v ?? "").toUpperCase());

     const isName = n.includes("NOM PRENOM");

     // alignement horizontal
     tf.setAlignment(isName ? PDFLib.TextAlignment.Left : PDFLib.TextAlignment.Center);

     // rendu stable
     tf.enableMultiline();
     tf.setMaxLength(100);

     // style par document + exceptions
     const st = getStyle(docKey, n);
     tf.setFontSize(st.fontSize);
     tf.setLineHeight(st.lineHeight);

   }catch{}
 }

 form.updateFieldAppearances(font);
 form.flatten();

 const bytes=await pdfDoc.save();
 const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
 const iframe=document.createElement("iframe");
 iframe.style.display="none";
 iframe.src=url;
 document.body.appendChild(iframe);
 iframe.onload=()=>iframe.contentWindow.print();
}

/* boutons */
document.addEventListener("click",e=>{
 const b=e.target.closest("button[data-doc]"); if(!b)return;
 fillAndPrint(b.dataset.doc,b.dataset.vol||"1");
});

/* =========================
   AirportKeeper -> Dropdowns (version calquée index(62))
   ========================= */

const AK_PROXY = "https://airportkeeper-proxy.deruellehugo-49c.workers.dev/ak"; // :contentReference[oaicite:3]{index=3}

function $(id){ return document.getElementById(id); }
function upper(s){ return (s||"").toUpperCase().trim(); }

function isoToYYYYMMDD(iso){
  if(!iso) return "";
  const d = new Date(iso);
  if(isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

// ===== mêmes choix temps que index(62) ===== :contentReference[oaicite:4]{index=4}
function arrTimeMs(f){
  return Date.parse(f?.aibt || f?.eibt || f?.sibt || f?.aldt || f?.eldt || f?.afat || f?.efat || '') || null;
}
function depTimeMs(f){
  return Date.parse(f?.aobt || f?.eobt || f?.pobt || f?.ctot || f?.etot || f?.sobt || '') || null;
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
  const t   = hhmmFromMs(depTimeMs(f));
  const ff  = upper(f?.fullFlightNumber || f?.callsign || "");
  const to  = upper(f?.adesIata || f?.adesIcao || "");
  const reg = upper(f?.reg || "");
  const stand = (f?.pkg || "").toString().replace(/^P/i,"").trim();
  return `${t} ${ff || "(sans numéro)"} → ${to || "---"} (${reg || "REG?"}${stand ? ` · P${stand}` : ""})`;
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

  // DEP (date) ✅ ajoute pobt/ctot/etot
  const depIso = dep?.sobt || dep?.eobt || dep?.aobt || dep?.pobt || dep?.ctot || dep?.etot || dep?.atot || "";
  setVal(`dep_date_${n}`, isoToYYYYMMDD(depIso));

  setVal(`dep_flt_${n}`, upper(dep?.fullFlightNumber || dep?.callsign || ""));
  setVal(`dep_to_${n}`, upper(dep?.adesIata || dep?.adesIcao || ""));
  setVal(`dep_reg_${n}`, upper(dep?.reg || ""));

  const stand = (dep?.pkg || "").toString().replace(/^P/i,"").trim();
  if(stand) setVal(`parking_${n}`, stand);

  const prevArr = findPrevArrForDep(dep, arrAll);
  if(prevArr){
    // ARR (date) ✅ ajoute plein de fallbacks
    const arrIso = prevArr?.sibt || prevArr?.eibt || prevArr?.aibt || prevArr?.aldt || prevArr?.eldt || prevArr?.afat || prevArr?.efat || "";
    setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));

    setVal(`arr_flt_${n}`, upper(prevArr?.fullFlightNumber || prevArr?.callsign || ""));
    setVal(`arr_from_${n}`, upper(prevArr?.adepIata || prevArr?.adepIcao || ""));
    setVal(`arr_reg_${n}`, upper(prevArr?.reg || dep?.reg || ""));
  }else{
    setVal(`arr_reg_${n}`, upper(dep?.reg || ""));
  }
}

async function loadAKForDropdowns(){
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

    // vols départ du jour
    const inTodayDep = (f)=>{
      const t = Date.parse(f?.sobt || f?.eobt || f?.aobt || f?.atot || "");
      return t && t >= startDay.getTime() && t <= endDay.getTime();
    };

    const depToday = depAll.filter(inTodayDep);

    // tri chrono
    depToday.sort((a,b)=>{
      const ta = depTimeMs(a);
      const tb = depTimeMs(b);
      if(ta == null && tb == null) return 0;
      if(ta == null) return 1;
      if(tb == null) return -1;
      return ta - tb;
    });

    // cache global
    window._akArrAll = arrAll;
    window._akDepToday = depToday;

    // inject dropdowns
    [1,2].forEach(n=>{
      const sel = $(`ak_flight_${n}`);
      const st  = $(`ak_status_${n}`);
      if(!sel) return;

      sel.innerHTML = `<option value="">-- Choisir un vol --</option>`;
      for(const f of depToday){
        const opt = document.createElement("option");
        opt.value = String(f?.id ?? "");
        opt.textContent = buildDepLabel(f);
        sel.appendChild(opt);
      }

      if(st) st.textContent = `${depToday.length} vol(s)`;
    });

  }catch(e){
    const msg = `Erreur AK (${String(e.message || e)})`;
    if(st1) st1.textContent = msg;
    if(st2) st2.textContent = msg;
  }
}

function bindAKSelect(n){
  const sel = $(`ak_flight_${n}`);
  if(!sel) return;

  sel.addEventListener("change", ()=>{
    const id = sel.value;
    if(!id) return;

    const dep = (window._akDepToday || []).find(f => String(f?.id ?? "") === String(id));
    if(!dep) return;

    applyDepToVol(n, dep, window._akArrAll || []);
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  bindAKSelect(1);
  bindAKSelect(2);
  loadAKForDropdowns();
});

