/* ══════════════════════════════════════════════
   Benefit Computer – Quotation App · script.js
   ══════════════════════════════════════════════ */

// ── COMPANY CONSTANTS ──────────────────────────
const COMPANY = {
  name:    "Benefit Computer",
  address: "Shop No. 122-123, Super Market,\nBudh Bazar, Moradabad, UP - 244001",
  phone:   "9219598354 | 9639374593",
  email:   "faizandelhi25@gmail.com",
  bank: {
    name:    "IDBI Bank",
    type:    "Current Account",
    account: "000000000123",
    ifsc:    "IBKL00009",
    branch:  "LG Showroom, Moradabad"
  },
  tc: [
    "This quotation is valid for 15 days from the date of issue.",
    "Prices are subject to change without prior notice after the validity period.",
    "Delivery timeline will be confirmed upon order confirmation.",
    "Payment is due prior to delivery of goods/services unless otherwise agreed.",
    "Warranty terms are as per manufacturer policy. We do not cover physical damage.",
    "For services, a 50% advance payment is required before commencement of work.",
    "Any dispute will be subject to Moradabad jurisdiction only."
  ]
};

const GST_RATE = 0.18;

// ── INIT ───────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setDefaultDate();
  addRow();
  updateGSTNote();
});

function setDefaultDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("quoteDate").value = today;
}

// ── ROW MANAGEMENT ─────────────────────────────
let rowCount = 0;

function addRow() {
  rowCount++;
  const tbody = document.getElementById("itemBody");
  const gstMode = document.getElementById("gstMode").value;
  const showGstCol = gstMode === "extra" || gstMode === "included";

  const tr = document.createElement("tr");
  tr.id = "row-" + rowCount;
  tr.innerHTML = `
    <td class="sno-cell">${tbody.rows.length + 1}</td>
    <td><input type="text" placeholder="Item / service description" oninput="recalc()" /></td>
    <td><input type="number" value="1" min="1" style="text-align:center;width:52px" oninput="recalc()" /></td>
    <td><input type="number" value="" min="0" step="0.01" placeholder="0.00" style="text-align:right" oninput="recalc()" /></td>
    <td class="gst-cell" id="gst-${rowCount}" style="display:${showGstCol ? 'table-cell' : 'none'}">–</td>
    <td class="amount-cell" id="amt-${rowCount}">–</td>
    <td><button class="btn-del" onclick="deleteRow('row-${rowCount}')" title="Remove">✕</button></td>
  `;
  tbody.appendChild(tr);
  recalc();
  renumberRows();
}

function deleteRow(id) {
  const rows = document.getElementById("itemBody").rows;
  if (rows.length <= 1) return; // keep at least 1
  document.getElementById(id)?.remove();
  renumberRows();
  recalc();
}

function renumberRows() {
  const rows = document.getElementById("itemBody").rows;
  for (let i = 0; i < rows.length; i++) {
    rows[i].cells[0].textContent = i + 1;
  }
}

// ── GST MODE ───────────────────────────────────
function updateTableHeaders() {
  const mode = document.getElementById("gstMode").value;
  const thGst  = document.getElementById("th-gst");
  const thPrice = document.getElementById("th-price");
  const gstRow  = document.getElementById("gstRow");

  if (mode === "extra") {
    thGst.style.display = "table-cell";
    thPrice.textContent = "Unit Price () excl. GST";
    gstRow.style.display = "flex";
  } else if (mode === "included") {
    thGst.style.display = "table-cell";
    thPrice.textContent = "Unit Price () incl. GST";
    gstRow.style.display = "flex";
  } else {
    thGst.style.display = "none";
    thPrice.textContent = "Unit Price ()";
    gstRow.style.display = "none";
  }

  // show/hide gst cells in each row
  const rows = document.getElementById("itemBody").rows;
  for (let i = 0; i < rows.length; i++) {
    const gstCell = rows[i].querySelector("[id^='gst-']");
    if (gstCell) gstCell.style.display = (mode !== "none") ? "table-cell" : "none";
  }

  updateGSTNote();
  recalc();
}

function updateGSTNote() {
  const mode = document.getElementById("gstMode").value;
  const note = document.getElementById("gstNote");
  if (mode === "none") {
    note.textContent = "Prices will be used as-is. No GST will be shown.";
  } else if (mode === "included") {
    note.textContent = "Price already includes 18% GST. Base value = Price ÷ 1.18. GST = Price − Base.  e.g. 100 → Base 84.75 + GST 15.25";
  } else {
    note.textContent = "18% GST will be added on top of entered price.  e.g. 100 → GST 18 → Total 118";
  }
}

// ── CALCULATIONS ───────────────────────────────
function recalc() {
  const mode = document.getElementById("gstMode").value;
  const rows = document.getElementById("itemBody").rows;
  let subtotal = 0, totalGst = 0;

  for (let i = 0; i < rows.length; i++) {
    const inputs = rows[i].querySelectorAll("input");
    const qty   = parseFloat(inputs[1].value) || 0;
    const price = parseFloat(inputs[2].value) || 0;
    const rowId = rows[i].id.replace("row-", "");
    const gstCell = document.getElementById("gst-" + rowId);
    const amtCell = document.getElementById("amt-" + rowId);

    let base = 0, gstAmt = 0, lineTotal = 0;

    if (mode === "none") {
      lineTotal = qty * price;
      base = lineTotal;
    } else if (mode === "extra") {
      base      = qty * price;
      gstAmt    = base * GST_RATE;
      lineTotal = base + gstAmt;
    } else if (mode === "included") {
      // price includes GST
      lineTotal = qty * price;
      base      = lineTotal / (1 + GST_RATE);
      gstAmt    = lineTotal - base;
    }

    subtotal  += (mode === "included") ? base : base;
    totalGst  += gstAmt;

    if (gstCell) gstCell.textContent = gstAmt > 0 ? " " + gstAmt.toFixed(2) : "–";
    if (amtCell) {
      // for "included" show the full line price in amount col; for "extra" show base
      const displayAmt = (mode === "extra") ? base : lineTotal;
      amtCell.textContent = displayAmt > 0 ? " " + displayAmt.toFixed(2) : "–";
    }
  }

  let grand = subtotal + totalGst;
  if (mode === "included") grand = subtotal + totalGst; // already = sum of line totals

  document.getElementById("subtotalVal").textContent = " " + subtotal.toFixed(2);
  document.getElementById("gstVal").textContent      = " " + totalGst.toFixed(2);
  document.getElementById("grandVal").textContent    = " " + grand.toFixed(2);

  if (mode === "included") {
    document.getElementById("gstLabel").textContent = "GST @ 18% (extracted)";
  } else {
    document.getElementById("gstLabel").textContent = "GST @ 18%";
  }
}

// ── RESET ──────────────────────────────────────
function resetForm() {
  if (!confirm("Reset all fields? This cannot be undone.")) return;
  document.getElementById("quoteNo").value      = "";
  document.getElementById("custName").value     = "";
  document.getElementById("custCompany").value  = "";
  document.getElementById("custMobile").value   = "";
  document.getElementById("custEmail").value    = "";
  document.getElementById("custAddress").value  = "";
  document.getElementById("notes").value        = "";
  document.getElementById("gstMode").value      = "none";
  document.getElementById("itemBody").innerHTML = "";
  rowCount = 0;
  setDefaultDate();
  updateTableHeaders();
  addRow();
}

// ── PDF GENERATION ─────────────────────────────
function generatePDF() {
  const custName = document.getElementById("custName").value.trim();
  if (!custName) { alert("Please enter Customer Name before generating PDF."); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PW = 210, PH = 297;
  const ML = 14, MR = 14, MT = 14;
  const CW = PW - ML - MR;

  // colour palette
  const NAVY  = [26, 60, 110];
  const ORANGE = [232, 98, 42];
  const LGRAY = [240, 242, 245];
  const MGRAY = [180, 184, 190];
  const WHITE = [255, 255, 255];
  const BLACK = [30, 35, 48];

  let y = MT;

  /* ─ HEADER BAND ─ */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, 38, "F");

  // Company name
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(COMPANY.name, ML, 14);

  // address / contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(200, 210, 230);
  doc.text(COMPANY.address.replace("\n", "  |  "), ML, 20);
  doc.text(`Ph: ${COMPANY.phone}  |  ${COMPANY.email}`, ML, 25.5);

  // QUOTATION label on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...ORANGE);
  doc.text("QUOTATION", PW - MR, 16, { align: "right" });

  y = 46;

  /* ─ QUOTE META BOX ─ */
  const quoteNo   = document.getElementById("quoteNo").value || "–";
  const quoteDateRaw = document.getElementById("quoteDate").value;
  const quoteDate = quoteDateRaw ? formatDate(quoteDateRaw) : "–";

  const metaX = PW - MR - 72;
  doc.setFillColor(...LGRAY);
  doc.roundedRect(metaX, y - 6, 72, 20, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text("QUOTE NO.", metaX + 4, y);
  doc.text("DATE", metaX + 44, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(quoteNo, metaX + 4, y + 6);
  doc.text(quoteDate, metaX + 44, y + 6);

  /* ─ CUSTOMER INFO ─ */
  const custCompany = document.getElementById("custCompany").value.trim();
  const custMobile  = document.getElementById("custMobile").value.trim();
  const custEmail   = document.getElementById("custEmail").value.trim();
  const custAddress = document.getElementById("custAddress").value.trim();

  doc.setFillColor(...NAVY);
  doc.rect(ML, y - 6, 78, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text("BILL TO", ML + 3, y - 1.2);

  const custLines = [
    custName,
    custCompany,
    custMobile ? `Ph: ${custMobile}` : "",
    custEmail,
    custAddress
  ].filter(Boolean);

  let cy = y + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  custLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, 76);
    doc.text(wrapped, ML + 3, cy);
    cy += wrapped.length * 5;
  });

  y = Math.max(cy, y + 18) + 8;

  /* ─ ITEMS TABLE ─ */
  const mode = document.getElementById("gstMode").value;
  const tableRows = [];
  const domRows = document.getElementById("itemBody").rows;

  for (let i = 0; i < domRows.length; i++) {
    const inputs = domRows[i].querySelectorAll("input");
    const desc  = inputs[0].value.trim() || "–";
    const qty   = parseFloat(inputs[1].value) || 0;
    const price = parseFloat(inputs[2].value) || 0;

    let base = 0, gstAmt = 0, displayPrice = 0;

    if (mode === "none") {
      base = qty * price; displayPrice = price;
      tableRows.push([(i+1)+"", desc, qty+"", fmt(displayPrice), fmt(base)]);
    } else if (mode === "extra") {
      base    = qty * price;
      gstAmt  = base * GST_RATE;
      tableRows.push([(i+1)+"", desc, qty+"", fmt(price), fmt(gstAmt), fmt(base + gstAmt)]);
    } else { // included
      const lineTotal = qty * price;
      base    = lineTotal / (1 + GST_RATE);
      gstAmt  = lineTotal - base;
      tableRows.push([(i+1)+"", desc, qty+"", fmt(price), fmt(gstAmt), fmt(lineTotal)]);
    }
  }

  const hasGst = mode !== "none";
  const head = hasGst
    ? [["#", "Description", "Qty", mode === "extra" ? "Price (excl. GST)" : "Price (incl. GST)", "GST 18%", "Amount ()"]]
    : [["#", "Description", "Qty", "Unit Price ()", "Amount ()"]];

  const colStyles = hasGst
    ? { 0:{cellWidth:8,halign:"center"}, 1:{cellWidth:70}, 2:{cellWidth:14,halign:"center"}, 3:{cellWidth:30,halign:"right"}, 4:{cellWidth:24,halign:"right"}, 5:{cellWidth:30,halign:"right"} }
    : { 0:{cellWidth:8,halign:"center"}, 1:{cellWidth:90}, 2:{cellWidth:16,halign:"center"}, 3:{cellWidth:34,halign:"right"}, 4:{cellWidth:34,halign:"right"} };

  doc.autoTable({
    startY: y,
    head: head,
    body: tableRows,
    styles: { fontSize: 8.5, cellPadding: 3.5, textColor: BLACK },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: LGRAY },
    columnStyles: colStyles,
    margin: { left: ML, right: MR },
    tableWidth: CW,
    theme: "grid"
  });

  y = doc.lastAutoTable.finalY + 4;

  /* ─ TOTALS ─ */
  const subtotal = parseFloat(document.getElementById("subtotalVal").textContent.replace(" ", "")) || 0;
  const gstAmt2  = parseFloat(document.getElementById("gstVal").textContent.replace(" ", "")) || 0;
  const grand    = parseFloat(document.getElementById("grandVal").textContent.replace(" ", "")) || 0;

  const totX = PW - MR - 72;
  let ty = y + 2;

  const totRows = hasGst
    ? [
        ["Subtotal (excl. GST)", fmt(subtotal)],
        [mode === "included" ? "GST @ 18% (extracted)" : "GST @ 18%", fmt(gstAmt2)],
        ["TOTAL AMOUNT", " " + grand.toFixed(2)]
      ]
    : [["TOTAL AMOUNT", " " + grand.toFixed(2)]];

  totRows.forEach((row, idx) => {
    const isLast = idx === totRows.length - 1;
    if (isLast) {
      doc.setFillColor(...NAVY);
      doc.rect(totX, ty - 4.5, 72, 9, "F");
      doc.setTextColor(...WHITE);
    } else {
      doc.setFillColor(248, 249, 251);
      doc.rect(totX, ty - 4.5, 72, 9, "F");
      doc.setTextColor(...BLACK);
    }
    doc.setFont("helvetica", isLast ? "bold" : "normal");
    doc.setFontSize(isLast ? 9.5 : 8.5);
    doc.text(row[0], totX + 4, ty);
    doc.text(row[1], totX + 68, ty, { align: "right" });
    ty += 10;
  });

  y = Math.max(y + totRows.length * 10 + 6, ty + 4);

  /* ─ NOTES ─ */
  const notes = document.getElementById("notes").value.trim();
  if (notes) {
    if (y > PH - 60) { doc.addPage(); y = MT; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("NOTES:", ML, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BLACK);
    const noteLines = doc.splitTextToSize(notes, CW);
    doc.text(noteLines, ML, y + 5);
    y += noteLines.length * 5 + 10;
  }

  /* ─ BANK DETAILS ─ */
  if (y > PH - 60) { doc.addPage(); y = MT; }
  doc.setFillColor(...LGRAY);
  doc.rect(ML, y, CW, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text("PAYMENT / BANK DETAILS", ML + 3, y + 3.5);
  y += 7;

  const bankInfo = [
    `Bank: ${COMPANY.bank.name}    Account Type: ${COMPANY.bank.type}`,
    `Account No: ${COMPANY.bank.account}    IFSC: ${COMPANY.bank.ifsc}`,
    `Branch: ${COMPANY.bank.branch}`
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  bankInfo.forEach(line => { doc.text(line, ML + 3, y); y += 5; });
  y += 4;

  /* ─ T&C ─ */
  if (y > PH - 60) { doc.addPage(); y = MT; }
  doc.setFillColor(...LGRAY);
  doc.rect(ML, y, CW, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text("TERMS & CONDITIONS", ML + 3, y + 3.5);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(80, 85, 100);
  COMPANY.tc.forEach((line, i) => {
    const wrapped = doc.splitTextToSize(`${i + 1}. ${line}`, CW - 4);
    doc.text(wrapped, ML + 3, y);
    y += wrapped.length * 4.5;
  });
  y += 6;

  /* ─ SIGNATURE ─ */
  if (y > PH - 30) { doc.addPage(); y = MT; }
  doc.setDrawColor(...MGRAY);
  doc.line(ML, y + 12, ML + 60, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text("Benefit Computer", ML, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);
  doc.text("Authorised Signatory", ML, y + 22);

  /* ─ FOOTER ─ */
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(...NAVY);
    doc.rect(0, PH - 10, PW, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text(`${COMPANY.name}  ·  ${COMPANY.phone}  ·  ${COMPANY.email}`, ML, PH - 4);
    doc.text(`Page ${p} of ${pageCount}`, PW - MR, PH - 4, { align: "right" });
  }

  // ── Save
  const fileName = `Quotation_${quoteNo || "BC"}_${(document.getElementById("quoteDate").value || "").replace(/-/g, "")}.pdf`;
  doc.save(fileName);
}

// ── HELPERS ────────────────────────────────────
function fmt(n) { return " " + (parseFloat(n) || 0).toFixed(2); }

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
