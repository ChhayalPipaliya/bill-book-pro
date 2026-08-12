/** Exports a DOM node as a single-page A4 PDF, preserving the printed bill layout exactly. */
export async function exportBillPdf(element: HTMLElement, fileName: string) {
  const html2pdf = (await import("html2pdf.js")).default as any;
  await html2pdf()
    .set({
      margin: 0,
      filename: fileName,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: 794,
        width: 794,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
      pagebreak: { mode: ["avoid-all"] },
    })
    .from(element)
    .save();
}
