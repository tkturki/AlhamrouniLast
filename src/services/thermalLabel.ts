// Thermal Label Printing - Small labels for thermal printers
// Standard sizes: 40x30mm, 50x25mm, 30x20mm

export interface ThermalLabelData {
  itemCode: string;
  weight: number;
  karat?: string;
  pricePerGram?: number;
  storeName?: string;
}

export interface ThermalLabelSize {
  width: number;  // mm
  height: number; // mm
  name: string;
}

// Common thermal label sizes
export const THERMAL_SIZES: ThermalLabelSize[] = [
  { width: 40, height: 30, name: '40x30mm (صغير)' },
  { width: 50, height: 25, name: '50x25mm (وسط)' },
  { width: 30, height: 20, name: '30x20mm (دائري)' },
];

// Generate thermal label HTML
export const generateThermalLabel = (
  data: ThermalLabelData,
  size: ThermalLabelSize = THERMAL_SIZES[0]
): string => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.itemCode}`;

  // Scale factor: 1mm = 3.78px at 96dpi
  const scale = 3.78;
  const widthPx = Math.round(size.width * scale);
  const heightPx = Math.round(size.height * scale);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          width: ${widthPx}px;
          height: ${heightPx}px;
          padding: 3px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          direction: ltr;
        }
        .qr-code {
          width: ${Math.min(widthPx * 0.6, 50)}px;
          height: ${Math.min(widthPx * 0.6, 50)}px;
        }
        .qr-code img {
          width: 100%;
          height: 100%;
        }
        .info {
          margin-top: 2px;
          text-align: center;
          font-weight: bold;
        }
        .code {
          font-size: 9px;
          color: #333;
          font-family: monospace;
        }
        .weight {
          font-size: 11px;
          color: #000;
          font-weight: bold;
        }
        .karat {
          font-size: 8px;
          color: #666;
        }
        @media print {
          body {
            margin: 0;
            padding: 2px;
          }
        }
      </style>
    </head>
    <body>
      <div class="qr-code">
        <img src="${qrUrl}" alt="QR" />
      </div>
      <div class="info">
        <div class="code" dir="ltr">${data.itemCode}</div>
        <div class="weight">${data.weight.toFixed(2)} g</div>
        ${data.karat ? `<div class="karat">K ${data.karat}</div>` : ''}
      </div>
    </body>
    </html>
  `;
};

// Print thermal label
export const printThermalLabel = (
  data: ThermalLabelData,
  size: ThermalLabelSize = THERMAL_SIZES[0]
): void => {
  const html = generateThermalLabel(data, size);
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.print();
    // Don't close window immediately, let user see it
  };
};

// Print multiple labels (label sheet)
export const printLabelSheet = (
  labels: ThermalLabelData[],
  rows: number = 5,
  cols: number = 3,
  size: ThermalLabelSize = THERMAL_SIZES[0]
): void => {
  const scale = 3.78;
  const labelWidth = size.width * scale;
  const labelHeight = size.height * scale;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', sans-serif;
          display: grid;
          grid-template-columns: repeat(${cols}, ${labelWidth}px);
          grid-template-rows: repeat(${rows}, ${labelHeight}px);
          gap: 2px;
          padding: 10px;
        }
        .label {
          width: ${labelWidth}px;
          height: ${labelHeight}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed #ccc;
          padding: 2px;
        }
        .qr-code img {
          width: ${Math.min(labelWidth * 0.5, 40)}px;
          height: ${Math.min(labelWidth * 0.5, 40)}px;
        }
        .info { text-align: center; margin-top: 2px; }
        .code { font-size: 8px; font-family: monospace; }
        .weight { font-size: 10px; font-weight: bold; }
        .karat { font-size: 7px; color: #666; }
        @media print {
          body { padding: 5px; }
          .label { border: none; }
        }
      </style>
    </head>
    <body>
  `;

  for (const label of labels) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(label.itemCode)}`;
    html += `
      <div class="label">
        <div class="qr-code">
          <img src="${qrUrl}" alt="QR" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%220.35em%22 font-size=%2210%22%3EQR%3C/text%3E%3C/svg%3E'" />
        </div>
        <div class="info">
          <div class="code" dir="ltr">${label.itemCode}</div>
          <div class="weight">${label.weight.toFixed(2)} g</div>
          ${label.karat ? `<div class="karat">K ${label.karat}</div>` : ''}
        </div>
      </div>
    `;
  }

  html += '</body></html>';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
};

// Preview label before printing
export const previewThermalLabel = (
  data: ThermalLabelData,
  size: ThermalLabelSize = THERMAL_SIZES[0]
): HTMLElement => {
  const scale = 3.78;
  const container = document.createElement('div');
  container.style.cssText = `
    background: #f0f0f0;
    padding: 20px;
    border-radius: 8px;
    display: inline-block;
  `;

  const label = document.createElement('div');
  const widthPx = Math.round(size.width * scale * 5);
  const heightPx = Math.round(size.height * scale * 5);

  label.style.cssText = `
    width: ${widthPx}px;
    height: ${heightPx}px;
    background: white;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Segoe UI', sans-serif;
    border: 2px solid #333;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;

  const qrImg = document.createElement('img');
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data.itemCode}`;
  qrImg.style.cssText = 'width: 80px; height: 80px;';

  const info = document.createElement('div');
  info.innerHTML = `
    <div style="font-size: 10px; font-family: monospace; margin-top: 4px;">${data.itemCode}</div>
    <div style="font-size: 14px; font-weight: bold; margin-top: 2px;">${data.weight.toFixed(2)} غ</div>
    ${data.karat ? `<div style="font-size: 8px; color: #666;">عيار ${data.karat}</div>` : ''}
  `;

  label.appendChild(qrImg);
  label.appendChild(info);
  container.appendChild(label);

  return container;
};

// Generate barcode for label (Code 128 format)
export const generateBarcode = (code: string): string => {
  // Simple barcode generation - in production, use a library like JsBarcode
  return `https://barcodeapi.org/api/128/${code}`;
};
