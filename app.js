const { PDFDocument, StandardFonts } = PDFLib;
const $ = (id) => document.getElementById(id);

let lastBlobUrl = null;

function isoToDDMMYYYY(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getData() {
  return {
    arr: {
      date: $("arr_date").value,
      flt: $("arr_flt").value,
      from: $("arr_from").value,
      reg: $("arr_reg").value,
      type: $("arr_type").value,
    },
    dep: {
      date: $("dep_date").value,
      flt: $("dep_flt").value,
      to: $("dep_to").value,
      reg: $("dep_reg").value,
      type: $("dep_type").value,
    },
  };
}

const DOCS = {
  LIR_RYANAIR: {
    file: "./templates/LIR RYANAIR BELLOVA.pdf",
    fill: ({ dep }) => ({
      "DATE": isoToDDMMYYYY(dep.date),
      "IMMATRICULATION": dep.reg,
      "FLIGHT NUMBER": dep.flt,
      "DESTINATION": dep.to,
    }),
    flatten: true,
  },

  BBCG_GATE: {
    file: "./templates/BBCG_Apr2020_Rev1 - BAGGAGE BINGO CARD_GATE.pdf",
    fill: ({ dep }) => ({
      "Date": isoToDDMMYYYY(dep.date),
      "Flt Nbr": dep.flt,
      "Dest": dep.to,
    }),
    flatten: true,
  },

  WAIF: {
  file: "./templates/WAIF_Jun2021_Rev1.1_ WALKAROUND INSPECTION FORM.pdf",
  fill: ({ arr, dep }) => ({
    "station": "BVA",                // 👈 ajout fixe
    "Arival flihht number": arr.flt,
    "date x": isoToDDMMYYYY(arr.date),
    "reg": arr.reg,
    "departure": dep.flt,
    "date x2": isoToDDMMYYYY(dep.date),
  }),
  flatten: true,
},

  RTB: {
    file: "./templates/RTB_Mar2025_Rev3_Ready To Board.pdf",
    fill: ({ dep }) => ({
      "Text1": isoToDDMMYYYY(dep.date),
      "Text2": dep.flt,
      "Text3": dep.to,
      "Text4": dep.reg,
    }),
    flatten: true,
  },
};

async function fillAndPrint(docKey) {
  const def = DOCS[docKey];
  const data = getData();

  const pdfBytes = await fetch(def.file).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(font);

  const fields = def.fill(data);
  for (const [name, value] of Object.entries(fields)) {
    try { form.getTextField(name).setText(value || ""); } catch {}
  }

  form.flatten();

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => iframe.contentWindow.print();
}

document.addEventListener("click", e => {
  const btn = e.target.closest("button[data-doc]");
  if (!btn) return;
  fillAndPrint(btn.dataset.doc);
});
