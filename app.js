const { PDFDocument, StandardFonts } = PDFLib;

/* =========================
   UTILS
========================= */

function isoToDDMMYYYY(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

/* =========================
   RÉCUPÉRATION DES 2 VOLS
========================= */

function getVol(n) {
  const g = (id) => (document.getElementById(`${id}_${n}`)?.value || "").trim();

  return {
    arr: {
      date: g("arr_date"),
      flt: g("arr_flt"),
      from: g("arr_from"),
      reg: g("arr_reg"),
      type: g("arr_type"),
    },
    dep: {
      date: g("dep_date"),
      flt: g("dep_flt"),
      to: g("dep_to"),
      reg: g("dep_reg"),
      type: g("dep_type"),
    },
  };
}

function isVolEmpty(vol) {
  const vals = [
    vol.arr.date, vol.arr.flt, vol.arr.from, vol.arr.reg, vol.arr.type,
    vol.dep.date, vol.dep.flt, vol.dep.to,  vol.dep.reg,  vol.dep.type
  ];
  return vals.every(v => !v);
}

/* =========================
   CONFIG DES PDF
========================= */

const DOCS = {
  /* ================= FR / RK ================= */

  LIR_RYANAIR: {
    file: "./templates/LIR RYANAIR BELLOVA.pdf",
    fill: ({ vol1 }) => ({
      "DATE": isoToDDMMYYYY(vol1.dep.date),
      "IMMATRICULATION": vol1.dep.reg,
      "FLIGHT NUMBER": vol1.dep.flt,
      "DESTINATION": vol1.dep.to,
    }),
    flatten: true,
  },

  // Nouveaux FR (mapping à faire)
  LIR_LAUDA: {
    file: "./templates/lauda-lir.pdf",
    fill: ({ vol1 }) => ({}),
    flatten: true,
  },

  BINGO_FR: {
    file: "./templates/BINGO.pdf",
    fill: ({ vol1 }) => ({}),
    flatten: true,
  },

  AUTOCONTROLE: {
    file: "./templates/Autocontrôle V1 (1).pdf",
    fill: ({ vol1 }) => ({}),
    flatten: true,
  },

  PRESTA_DEP: {
    file: "./templates/Suivi prestations bases - depart base.pdf",
    fill: ({ vol1 }) => ({}),
    flatten: true,
  },

  PRESTA_RET: {
    file: "./templates/Suivi prestations bases - retour base.pdf",
    fill: ({ vol1 }) => ({}),
    flatten: true,
  },

  /* ================= W6 / W4 ================= */

  BBCG_GATE: {
    file: "./templates/BBCG_Apr2020_Rev1 - BAGGAGE BINGO CARD_GATE.pdf",
    fill: ({ vol1 }) => ({
      "Date": isoToDDMMYYYY(vol1.dep.date),
      "Flt Nbr": vol1.dep.flt,
      "Dest": vol1.dep.to,
    }),
    flatten: true,
  },

  WAIF: {
    file: "./templates/WAIF_Jun2021_Rev1.1_ WALKAROUND INSPECTION FORM.pdf",
    fill: ({ vol1 }) => ({
      "station": "BVA",
      "Arival flihht number": vol1.arr.flt,
      "date x": isoToDDMMYYYY(vol1.arr.date),
      "reg": vol1.arr.reg,
      "departure": vol1.dep.flt,
      "date x2": isoToDDMMYYYY(vol1.dep.date),
    }),
    flatten: true,
  },

  RTB: {
    file: "./templates/RTB_Mar2025_Rev3_Ready To Board.pdf",
    fill: ({ vol1 }) => ({
      "Text1": isoToDDMMYYYY(vol1.dep.date),
      "Text2": vol1.dep.flt,
      "Text3": vol1.dep.to,
      "Text4": vol1.dep.reg,
    }),
    flatten: true,
  },

  /* ========= EXEMPLE PDF 2xA5 (à adapter) ========= */
  TWOUP_EXAMPLE: {
    file: "./templates/DOC_2UP.pdf",
    fill: ({ vol1, vol2 }) => {
      const out = {};

      if (!isVolEmpty(vol1)) {
        out["Date"] = isoToDDMMYYYY(vol1.dep.date);
        out["Flt Nbr"] = vol1.dep.flt;
        out["Dest"] = vol1.dep.to;
      }

      if (!isVolEmpty(vol2)) {
        out["Date_2"] = isoToDDMMYYYY(vol2.dep.date);
        out["Flt Nbr_2"] = vol2.dep.flt;
        out["Dest_2"] = vol2.dep.to;
      }

      return out;
    },
    flatten: true,
  },
};

/* =========================
   REMPLISSAGE + IMPRESSION
========================= */

async function fillAndPrint(docKey) {
  const def = DOCS[docKey];
  if (!def) {
    alert("Document non configuré.");
    return;
  }

  const vol1 = getVol(1);
  const vol2 = getVol(2);

  try {
    const res = await fetch(def.file);
    if (!res.ok) throw new Error(`Impossible de charger: ${def.file}`);
    const pdfBytes = await res.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    try { form.updateFieldAppearances(font); } catch {}

    const fields = def.fill({ vol1, vol2 });

    for (const [name, value] of Object.entries(fields)) {
      try {
        const field = form.getTextField(name);
        field.setText(value || "");
        field.setFontSize(16); // taille globale provisoire
      } catch {
        console.log("Champ introuvable :", name);
      }
    }

    if (def.flatten) {
      try { form.flatten(); } catch {}
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // nettoyage
      setTimeout(() => {
        URL.revokeObjectURL(url);
        iframe.remove();
      }, 1500);
    };

  } catch (err) {
    console.error(err);
    alert("Erreur chargement/remplissage PDF. Vérifie les noms de fichiers et le chemin ./templates/...");
  }
}

/* =========================
   BOUTONS
========================= */

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-doc]");
  if (!btn) return;
  fillAndPrint(btn.dataset.doc);
});
