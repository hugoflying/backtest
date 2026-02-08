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

function upper(s) {
  return (s || "").trim().toUpperCase();
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

function getOptionalValue(id) {
  return (document.getElementById(id)?.value || "").trim();
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

  BINGO_FR: {
    file: "./templates/BINGO.pdf",
    // Champs réels : BINGO_GEN_DATE / BINGO_GEN_FLIGHT_NUMBER / BINGO_GEN_REGISTRATION / Textbox2 (destination)
    fill: ({ vol1 }) => ({
      "BINGO_GEN_DATE": isoToDDMMYYYY(vol1.dep.date),
      "BINGO_GEN_FLIGHT_NUMBER": vol1.dep.flt,
      "BINGO_GEN_REGISTRATION": vol1.dep.reg,
      "Textbox2": vol1.dep.to, // Destination
    }),
    flatten: true,
  },

  LIR_LAUDA: {
    file: "./templates/lauda-lir.pdf",
    // Champs réels : LAUDA_FLIGHT_NUMBER / LAUDA_IMMATRICULATION / LAUDA_DATE / LAUDA_FROM / LAUDA_TO
    fill: ({ vol1 }) => ({
      "LAUDA_FLIGHT_NUMBER": vol1.dep.flt,
      "LAUDA_IMMATRICULATION": vol1.dep.reg,
      "LAUDA_DATE": isoToDDMMYYYY(vol1.dep.date),
      "LAUDA_FROM": "BVA",
      "LAUDA_TO": vol1.dep.to,
    }),
    flatten: true,
  },

  AUTOCONTROLE: {
    file: "./templates/Autocontrôle V1 (1).pdf",
    // Champs réels :
    // VOL_A_FLIGHT_NUMER / VOL_A_DATE / VOL_A_TO / VOL_A_FULL_NAME
    // VOL_B_FLIGHT_NUMBER / VOL_B_DATE / VOL_B_TO / VOL_B_FULL_NAME
    fill: ({ vol1, vol2 }) => {
      const out = {};
      const fullName = upper(getOptionalValue("full_name")); // optionnel si tu ajoutes un champ plus tard

      if (!isVolEmpty(vol1)) {
        out["VOL_A_FLIGHT_NUMER"] = vol1.dep.flt;              // en haut à gauche
        out["VOL_A_TO"] = vol1.dep.to;                        // destination sous le FLT
        out["VOL_A_DATE"] = isoToDDMMYYYY(vol1.dep.date);     // en haut à droite
        out["VOL_A_FULL_NAME"] = fullName;                    // bas
      }

      if (!isVolEmpty(vol2)) {
        out["VOL_B_FLIGHT_NUMBER"] = vol2.dep.flt;
        out["VOL_B_TO"] = vol2.dep.to;
        out["VOL_B_DATE"] = isoToDDMMYYYY(vol2.dep.date);
        out["VOL_B_FULL_NAME"] = fullName;
      }

      return out;
    },
    flatten: true,
  },

  PRESTA_DEP: {
    file: "./templates/Suivi prestations bases - depart base.pdf",
    // Champs réels :
    // VOL_A_IMMATRICULATION / VOL_A_DATE / VOL_A_PARKING / VOL_A_FLIGHT_NUMBER / VOL_A_FROM
    // VOL_B_IMMATRICULATION / VOL_B_DATE / VOL_B_PARKING / VOL_B_FLIGHT_NUMBER / VOL_B_FROM
    // checkboxes : VOL_A_DEPART / VOL_A_GPU / (VOL_A_ARRIVEE existe mais on ne coche pas)
    //             VOL_B_DEPART / VOL_B_GPU / (VOL_B_ARRIVEE existe mais on ne coche pas)
    fill: ({ vol1, vol2 }) => {
      const out = {};
      const parking1 = getOptionalValue("parking_1"); // optionnel si tu ajoutes un champ plus tard
      const parking2 = getOptionalValue("parking_2");

      if (!isVolEmpty(vol1)) {
        out["VOL_A_IMMATRICULATION"] = vol1.dep.reg;
        out["VOL_A_DATE"] = isoToDDMMYYYY(vol1.dep.date);
        out["VOL_A_PARKING"] = parking1;
        out["VOL_A_FLIGHT_NUMBER"] = vol1.dep.flt;
        out["VOL_A_FROM"] = vol1.arr.from; // provenance
        out["VOL_A_DEPART"] = true;
        out["VOL_A_GPU"] = true;
      }

      if (!isVolEmpty(vol2)) {
        out["VOL_B_IMMATRICULATION"] = vol2.dep.reg;
        out["VOL_B_DATE"] = isoToDDMMYYYY(vol2.dep.date);
        out["VOL_B_PARKING"] = parking2;
        out["VOL_B_FLIGHT_NUMBER"] = vol2.dep.flt;
        out["VOL_B_FROM"] = vol2.arr.from;
        out["VOL_B_DEPART"] = true;
        out["VOL_B_GPU"] = true;
      }

      return out;
    },
    flatten: true,
  },

  PRESTA_RET: {
    file: "./templates/Suivi prestations bases - retour base.pdf",
    // Champs réels :
    // VOL_A_IMMATRICULATION / VOL_A_DATE / VOL_A_PARKING / VOL_A_FLIGHT_NUMBER / VOL_A_FROM
    // VOL_B_IMMATRICULATION / VOL_B_DATE / VOL_B_PARKING / VOL_B_FLIGHT_NUMBER / VOL_B_FROM
    // checkboxes : VOL_A_ARRIVEE / VOL_A_MENAGE / VOL_A_GPU
    //             VOL_B_ARRIVEE / VOL_B_MENAGE / VOL_B_GPU
    fill: ({ vol1, vol2 }) => {
      const out = {};
      const parking1 = getOptionalValue("parking_1");
      const parking2 = getOptionalValue("parking_2");

      if (!isVolEmpty(vol1)) {
        out["VOL_A_IMMATRICULATION"] = vol1.arr.reg;
        out["VOL_A_DATE"] = isoToDDMMYYYY(vol1.arr.date);
        out["VOL_A_PARKING"] = parking1;
        out["VOL_A_FLIGHT_NUMBER"] = vol1.arr.flt;
        out["VOL_A_FROM"] = vol1.arr.from;
        out["VOL_A_ARRIVEE"] = true;
        out["VOL_A_MENAGE"] = true;
        out["VOL_A_GPU"] = true;
      }

      if (!isVolEmpty(vol2)) {
        out["VOL_B_IMMATRICULATION"] = vol2.arr.reg;
        out["VOL_B_DATE"] = isoToDDMMYYYY(vol2.arr.date);
        out["VOL_B_PARKING"] = parking2;
        out["VOL_B_FLIGHT_NUMBER"] = vol2.arr.flt;
        out["VOL_B_FROM"] = vol2.arr.from;
        out["VOL_B_ARRIVEE"] = true;
        out["VOL_B_MENAGE"] = true;
        out["VOL_B_GPU"] = true;
      }

      return out;
    },
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
        // CHECKBOX
        if (typeof value === "boolean") {
          const cb = form.getCheckBox(name);
          value ? cb.check() : cb.uncheck();
          continue;
        }

        // TEXT FIELD
        const tf = form.getTextField(name);
        tf.setText(String(value ?? ""));

        // 👇 PLUS GROS
        tf.setFontSize(18);

        // 👇 CENTRÉ
        tf.setAlignment(PDFLib.TextAlignment.Center);

      } catch (e) {
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
      setTimeout(() => {
        URL.revokeObjectURL(url);
        iframe.remove();
      }, 1500);
    };

  } catch (err) {
    console.error(err);
    alert("Erreur PDF. Vérifie le nom du fichier dans /templates.");
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
