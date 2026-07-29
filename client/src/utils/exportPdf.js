import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportReportToPdf = ({ title, subtitle, columns, data, filename = 'report.pdf' }) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Colors
  const primaryColor = [99, 102, 241]; // #6366f1 Indigo
  const textColor = [30, 41, 59]; // #1e293b Slate

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PricePilot AI', 14, 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title || 'Intelligence & Analytics Report', 14, 20);

  // Subtitle / Date
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 36);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 42);
  }

  // Data Table
  autoTable(doc, {
    startY: subtitle ? 48 : 42,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 40, left: 14, right: 14, bottom: 20 },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${pageCount} — Confidential • PricePilot AI Intelligence Engine`,
      105,
      287,
      { align: 'center' }
    );
  }

  doc.save(filename);
};
