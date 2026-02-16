const { PDFDocument, StandardFonts } = PDFLib;

function isoToDDMMYYYY(iso){
  if(!iso) return "";
  const [y,m,d]=iso.split("-");
  return `${d}/${m}/${y}`;
}

function upper(s){ return (s||"").toUpperCase().trim(); }

function getVol(n){
  const g=id=>document.getElementById(`${id}_${n}`)?.value||"";
  return {
    arr:{date:g("arr_date"),flt:g("arr_flt"),from:g("arr_from"),reg:g("arr_reg")},
    dep:{date:g("dep_date"),flt:g("dep_flt"),to:g("dep_to"),reg:g("dep_reg")}
  }
}

function isVolEmpty(v){
  return !v.arr.date&&!v.arr.flt&&!v.dep.date&&!v.dep.flt;
}

function parking(n){ return document.getElementById(`parking_${n}`)?.value||"" }
function agent(){ return upper(document.getElementById("full_name")?.value) }

const DOCS={

/* ---------- DOCS SIMPLES ---------- */

BINGO_FR:{
 file:"./templates/BINGO.pdf",
 fill:({vol1})=>({
   "Date":isoToDDMMYYYY(vol1.dep.date),
   "N° de vol":vol1.dep.flt,
   "Immat°":vol1.dep.reg,
   "Destination":vol1.dep.to
 }),
 flatten:true
},

LIR_RYANAIR:{
 file:"./templates/LIR RYANAIR BELLOVA.pdf",
 fill:({vol1})=>({
   "Date":isoToDDMMYYYY(vol1.dep.date),
   "A/C Reg.":vol1.dep.reg,
   "Flt. No.":vol1.dep.flt,
   "Dest.":vol1.dep.to
 }),
 flatten:true
},

LIR_LAUDA:{
 file:"./templates/lauda-lir.pdf",
 fill:({vol1})=>({
   "Flight Number":vol1.dep.flt,
   "Registration":vol1.dep.reg,
   "Date":isoToDDMMYYYY(vol1.dep.date),
   "From":"BVA",
   "To":vol1.dep.to
 }),
 flatten:true
},

BBCG_GATE:{
 file:"./templates/BBCG_Apr2020_Rev1 - BAGGAGE BINGO CARD_GATE.pdf",
 fill:({vol1})=>({
   "Date":isoToDDMMYYYY(vol1.dep.date),
   "Flt Nbr":vol1.dep.flt,
   "Dest":vol1.dep.to
 }),
 flatten:true
},

WAIF:{
 file:"./templates/WAIF_Jun2021_Rev1.1_ WALKAROUND INSPECTION FORM.pdf",
 fill:({vol1})=>({
   "station":"BVA",
   "Arival flihht number":vol1.arr.flt,
   "date x":isoToDDMMYYYY(vol1.arr.date),
   "reg":vol1.arr.reg,
   "departure":vol1.dep.flt,
   "date x2":isoToDDMMYYYY(vol1.dep.date)
 }),
 flatten:true
},

RTB:{
 file:"./templates/RTB_Mar2025_Rev3_Ready To Board.pdf",
 fill:({vol1})=>({
   "Text1":isoToDDMMYYYY(vol1.dep.date),
   "Text2":vol1.dep.flt,
   "Text3":vol1.dep.to,
   "Text4":vol1.dep.reg
 }),
 flatten:true
},

/* ---------- DOCS DOUBLES ---------- */

AUTOCONTROLE:{
 file:"./templates/Autocontrôle.pdf",
 fill:({vol1,vol2})=>{
   const o={},name=agent();

   if(!isVolEmpty(vol1)){
     o["FLIGHT_A"]=vol1.dep.flt;
     o["DEST_A"]=vol1.dep.to;
     o["DATE_A"]=isoToDDMMYYYY(vol1.dep.date);
     o["NAME_A"]=name;
   }

   if(!isVolEmpty(vol2)){
     o["FLIGHT_B"]=vol2.dep.flt;
     o["DEST_B"]=vol2.dep.to;
     o["DATE_B"]=isoToDDMMYYYY(vol2.dep.date);
     o["NAME_B"]=name;
   }
   return o;
 },
 flatten:true
},

PRESTA_DEP:{
 file:"./templates/Suivi prestations basés départ.pdf",
 fill:({vol1,vol2})=>{
   const o={};

   if(!isVolEmpty(vol1)){
     o["IMM_A"]=vol1.dep.reg;
     o["DATE_A"]=isoToDDMMYYYY(vol1.dep.date);
     o["PARK_A"]=parking(1);
     o["FLT_A"]=vol1.dep.flt;
     o["DEST_A"]=vol1.dep.to;
     o["DEPART_A"]=true;
     o["GPU_A"]=true;
   }

   if(!isVolEmpty(vol2)){
     o["IMM_B"]=vol2.dep.reg;
     o["DATE_B"]=isoToDDMMYYYY(vol2.dep.date);
     o["PARK_B"]=parking(2);
     o["FLT_B"]=vol2.dep.flt;
     o["DEST_B"]=vol2.dep.to;
     o["DEPART_B"]=true;
     o["GPU_B"]=true;
   }

   return o;
 },
 flatten:true
},

PRESTA_RET:{
 file:"./templates/Suivi prestations basés arrivée.pdf",
 fill:({vol1,vol2})=>{
   const o={};

   if(!isVolEmpty(vol1)){
     o["IMM_A"]=vol1.arr.reg;
     o["DATE_A"]=isoToDDMMYYYY(vol1.arr.date);
     o["PARK_A"]=parking(1);
     o["FLT_A"]=vol1.arr.flt;
     o["FROM_A"]=vol1.arr.from;
     o["ARR_A"]=true;
     o["MEN_A"]=true;
     o["GPU_A"]=true;
   }

   if(!isVolEmpty(vol2)){
     o["IMM_B"]=vol2.arr.reg;
     o["DATE_B"]=isoToDDMMYYYY(vol2.arr.date);
     o["PARK_B"]=parking(2);
     o["FLT_B"]=vol2.arr.flt;
     o["FROM_B"]=vol2.arr.from;
     o["ARR_B"]=true;
     o["MEN_B"]=true;
     o["GPU_B"]=true;
   }

   return o;
 },
 flatten:true
}

};

/* ---------- MOTEUR PDF ---------- */

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
     if(typeof v==="boolean"){ const cb=form.getCheckBox(n); v?cb.check():cb.uncheck(); continue;}
     const tf=form.getTextField(n);
     tf.setText(String(v??""));
     tf.setFontSize(18);
     tf.setAlignment(PDFLib.TextAlignment.Center);
     tf.enableMultiline();
   }catch{}
 }

 form.updateFieldAppearances(font);
 form.flatten();

 const bytes=await pdfDoc.save();
 const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
 const iframe=document.createElement("iframe");
 iframe.style.display="none"; iframe.src=url; document.body.appendChild(iframe);
 iframe.onload=()=>iframe.contentWindow.print();
}

/* boutons */
document.addEventListener("click",e=>{
 const b=e.target.closest("button[data-doc]"); if(!b)return;
 fillAndPrint(b.dataset.doc,b.dataset.vol||"1");
});

/* =========================
   AirportKeeper -> PDF Filler
   ========================= */

const AK_PROXY = "https://airportkeeper-proxy.deruellehugo-49c.workers.dev/ak"; // :contentReference[oaicite:3]{index=3}

function $(id){ return document.getElementById(id); }

function toUpper(s){ return (s || "").toUpperCase().trim(); }

function isoToYYYYMMDD(iso){
  if(!iso) return "";
  const d = new Date(iso);
  if(isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

function pickDepIso(f){
  return f?.sobt || f?.eobt || f?.aobt || f?.atot || "";
}
function pickArrIso(f){
  return f?.aibt || f?.eibt || f?.sibt || f?.aldt || f?.eldt || f?.afat || f?.efat || "";
}

function depTimeMs(f){
  const iso = pickDepIso(f);
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}
function arrTimeMs(f){
  const iso = pickArrIso(f);
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

async function fetchAK(flow, fromISO, toISO){
  const url = `${AK_PROXY}?flow=${encodeURIComponent(flow)}&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;
  const res = await fetch(url);
  const txt = await res.text(); // debug safe
  if(!res.ok) throw new Error(`AK ${res.status} ${txt.slice(0,200)}`);

  let data;
  try { data = JSON.parse(txt); } catch { throw new Error(`AK JSON invalide: ${txt.slice(0,200)}`); }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.flights)) return data.flights;
  if (Array.isArray(data?.data)) return data.data;

  console.log("AK payload inattendu:", data);
  return [];
}

function buildOptionLabelDEP(f){
  const ff   = toUpper(f?.fullFlightNumber || f?.callsign || "");
  const to   = toUpper(f?.adesIata || "");
  const reg  = toUpper(f?.reg || "");
  const tms  = depTimeMs(f);

  let hhmm = "--:--";
  if(tms != null){
    const d = new Date(tms);
    const hh = String(d.getHours()).padStart(2,"0");
    const mm = String(d.getMinutes()).padStart(2,"0");
    hhmm = `${hh}:${mm}`;
  }

  // exemple: "07:10 FR1234 → ALC (EI-DCL)"
  return `${hhmm} ${ff} → ${to || "---"} (${reg || "REG?"})`;
}

function standFromPkg(pkg){
  const s = (pkg || "").toString().trim();
  return s ? s.replace(/^P/i,"").trim() : "";
}

function setVal(id, v){
  const el = $(id);
  if(!el) return;
  el.value = (v ?? "");
  el.dispatchEvent(new Event("input", {bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
}

/**
 * Trouve l'arrivée la plus proche AVANT ce départ (même reg).
 * Fenêtre max 18h.
 */
function findPrevArrForDep(dep, arrList){
  const depT = depTimeMs(dep);
  if(depT == null) return null;
  const reg = toUpper(dep?.reg || "");
  if(!reg) return null;

  let best = null;
  let bestDt = Infinity;

  for(const a of (arrList || [])){
    if(toUpper(a?.reg || "") !== reg) continue;
    const aT = arrTimeMs(a);
    if(aT == null) continue;
    if(aT > depT) continue;

    const dt = depT - aT;
    if(dt < 0) continue;
    if(dt > 18 * 60 * 60 * 1000) continue;

    if(dt < bestDt){
      best = a;
      bestDt = dt;
    }
  }
  return best;
}

function applyDepToVol(n, dep, arrList){
  if(!dep) return;

  // ===== DEP =====
  const depIso = pickDepIso(dep);
  setVal(`dep_date_${n}`, isoToYYYYMMDD(depIso));

  const ff = toUpper(dep?.fullFlightNumber || dep?.callsign || "");
  setVal(`dep_flt_${n}`, ff);

  setVal(`dep_to_${n}`, toUpper(dep?.adesIata || ""));

  const reg = toUpper(dep?.reg || "");
  setVal(`dep_reg_${n}`, reg);

  const stand = standFromPkg(dep?.pkg);
  if(stand) setVal(`parking_${n}`, stand);

  // ===== ARR (auto via match) =====
  const prevArr = findPrevArrForDep(dep, arrList);
  if(prevArr){
    const arrIso = pickArrIso(prevArr);
    setVal(`arr_date_${n}`, isoToYYYYMMDD(arrIso));

    const arrFF = toUpper(prevArr?.fullFlightNumber || prevArr?.callsign || "");
    setVal(`arr_flt_${n}`, arrFF);

    setVal(`arr_from_${n}`, toUpper(prevArr?.adepIata || ""));

    setVal(`arr_reg_${n}`, toUpper(prevArr?.reg || reg));
  }else{
    // fallback minimal: reg si on l'a
    if(reg) setVal(`arr_reg_${n}`, reg);
  }
}

async function loadAKForDropdowns(){
  const st1 = $("ak_status_1");
  const st2 = $("ak_status_2");
  if(st1) st1.textContent = "Chargement…";
  if(st2) st2.textContent = "Chargement…";

  // fenêtre : aujourd’hui 00:00 -> 23:59 + linking large (±12h)
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
  const endDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);

  const linkFrom = new Date(startDay.getTime() - 12*60*60*1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const linkTo   = new Date(endDay.getTime()   + 12*60*60*1000).toISOString().replace(/\.\d{3}Z$/, "Z");

  const inTodayDEP = (f)=>{
    const t = depTimeMs(f);
    return t != null && t >= startDay.getTime() && t <= endDay.getTime();
  };

  try{
    const [arrAll, depAll] = await Promise.all([
      fetchAK("ARR", linkFrom, linkTo),
      fetchAK("DEP", linkFrom, linkTo),
    ]);

    const depToday = depAll.filter(inTodayDEP);

    // Tri chrono
    depToday.sort((a,b)=>{
      const ta = depTimeMs(a), tb = depTimeMs(b);
      if(ta == null && tb == null) return 0;
      if(ta == null) return 1;
      if(tb == null) return -1;
      return ta - tb;
    });

    // Cache
    window._akArrAll = arrAll;
    window._akDepToday = depToday;

    // Remplit les 2 selects avec la même liste
    [1,2].forEach(n=>{
      const sel = $(`ak_flight_${n}`);
      const st  = $(`ak_status_${n}`);
      if(!sel) return;

      sel.innerHTML = `<option value="">-- Choisir un vol --</option>`;
      for(const f of depToday){
        const opt = document.createElement("option");
        opt.value = String(f?.id ?? "");
        opt.textContent = buildOptionLabelDEP(f);
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

// Init
document.addEventListener("DOMContentLoaded", ()=>{
  bindAKSelect(1);
  bindAKSelect(2);
  loadAKForDropdowns();
});

