"use client";
import jsPDF from "jspdf";

export default function PdfInvoiceButton({ text }: { text: string }) {
  const generate = () => {
    const doc = new jsPDF();
    doc.text(text || "Invoice", 10, 10);
    doc.save("invoice.pdf");
  };
  return <button onClick={generate} className="px-3 py-2 rounded bg-green-600 text-white">Download Invoice PDF</button>;
}
