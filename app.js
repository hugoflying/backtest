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
