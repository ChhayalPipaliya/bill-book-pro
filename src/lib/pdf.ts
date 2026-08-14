import { jsPDF } from "jspdf";

const A4_W_MM = 210;
const A4_H_MM = 297;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Delivers the finished PDF to the device.
 * Desktop and Android Chrome get a normal blob download; iOS Safari cannot
 * reliably download blobs, so it gets the native share sheet (Files/WhatsApp)
 * with a download fallback if the user dismisses it.
 */
async function deliver(pdf: jsPDF, fileName: string) {
  const blob = pdf.output("blob") as Blob;

  if (isIOS() && typeof navigator !== "undefined" && "share" in navigator) {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (!nav.canShare || nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
        return;
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      console.error("Share sheet unavailable, falling back to download", error);
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Exports a DOM node as a print-ready A4 PDF.
 * The node is rasterised at its full rendered height and then sliced into as
 * many A4 pages as needed, so nothing is ever clipped. Slice boundaries are
 * nudged onto blank horizontal bands so table rows are never cut in half.
 */
export async function exportBillPdf(element: HTMLElement, fileName: string) {
  const html2canvas = (await import("html2canvas-pro")).default;

  const width = Math.ceil(element.scrollWidth || element.offsetWidth);
  const height = Math.ceil(element.scrollHeight || element.offsetHeight);

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    onclone: (doc: Document) => {
      doc.querySelectorAll<HTMLElement>("*").forEach((el) => {
        // html2canvas cannot rasterise calc()-based clip-path polygons and turns
        // them into stray triangles, so drop them in the cloned document only.
        if (el.style.clipPath) el.style.clipPath = "none";
      });
    },

  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  // Page height in canvas pixels, keeping the A4 aspect ratio at full width.
  const pageHeightPx = Math.floor((canvas.width * A4_H_MM) / A4_W_MM);

  // Single page, or a slight overflow that is better shrunk than split.
  if (canvas.height <= pageHeightPx * 1.14) {
    const mmHeight = Math.min(A4_H_MM, (canvas.height * A4_W_MM) / canvas.width);
    const mmWidth = (canvas.width * mmHeight) / canvas.height;
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      (A4_W_MM - mmWidth) / 2,
      0,
      mmWidth,
      mmHeight,
    );
    pdf.save(fileName);
    return;
  }


  const ctx = canvas.getContext("2d");
  const isBlankRow = (y: number) => {
    if (!ctx || y <= 0 || y >= canvas.height) return false;
    const data = ctx.getImageData(0, y, canvas.width, 1).data;
    for (let i = 0; i < data.length; i += 4 * 8) {
      if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) return false;
    }
    return true;
  };

  let offset = 0;
  let first = true;
  while (offset < canvas.height) {
    let sliceHeight = Math.min(pageHeightPx, canvas.height - offset);

    // If more content follows, back up to the nearest blank band (max 18%).
    if (offset + sliceHeight < canvas.height) {
      const minHeight = Math.floor(sliceHeight * 0.82);
      for (let h = sliceHeight; h > minHeight; h--) {
        if (isBlankRow(offset + h)) {
          sliceHeight = h;
          break;
        }
      }
    }

    const page = document.createElement("canvas");
    page.width = canvas.width;
    page.height = sliceHeight;
    const pageCtx = page.getContext("2d");
    if (!pageCtx) throw new Error("Could not create the PDF page canvas");
    pageCtx.fillStyle = "#ffffff";
    pageCtx.fillRect(0, 0, page.width, page.height);
    pageCtx.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    const mmHeight = (sliceHeight * A4_W_MM) / canvas.width;
    if (!first) pdf.addPage();
    pdf.addImage(page.toDataURL("image/jpeg", 0.98), "JPEG", 0, 0, A4_W_MM, mmHeight);

    first = false;
    offset += sliceHeight;
  }

  pdf.save(fileName);
}
