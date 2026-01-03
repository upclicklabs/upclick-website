import { jsPDF } from "jspdf";
import { AEOReport, AEORecommendation } from "./email-templates";

type RGB = [number, number, number];

const COLORS: Record<string, RGB> = {
  primary: [139, 92, 246], // Purple
  content: [139, 92, 246], // Purple
  technical: [59, 130, 246], // Blue
  authority: [236, 72, 153], // Pink
  measurement: [249, 115, 22], // Orange
  text: [30, 30, 30],
  muted: [100, 100, 100],
  light: [200, 200, 200],
  background: [250, 250, 250],
};

function getPillarColor(pillar: string): RGB {
  switch (pillar) {
    case "Content":
      return COLORS.content;
    case "Technical":
      return COLORS.technical;
    case "Authority":
      return COLORS.authority;
    case "Measurement":
      return COLORS.measurement;
    default:
      return COLORS.muted;
  }
}

export function generateAEOReportPDF(report: AEOReport): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper functions
  const addPage = () => {
    doc.addPage();
    yPos = margin;
  };

  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin) {
      addPage();
      return true;
    }
    return false;
  };

  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("AEO Assessment Report", margin, 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${report.url}`, margin, 35);

  yPos = 55;

  // Report metadata
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.text(`Generated: ${report.analyzedAt}`, margin, yPos);
  doc.text("UpClick Labs | upclicklabs.com", pageWidth - margin - doc.getTextWidth("UpClick Labs | upclicklabs.com"), yPos);
  yPos += 15;

  // Overall Score Section
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(margin, yPos, contentWidth, 50, 3, 3, "F");

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Overall AEO Maturity Score", margin + 10, yPos + 15);

  // Score circle
  const scoreX = margin + 40;
  const scoreY = yPos + 35;
  doc.setFillColor(...COLORS.primary);
  doc.circle(scoreX, scoreY, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(report.scores.overall.toFixed(1), scoreX - 7, scoreY + 5);

  // Maturity level
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.text(`Maturity Level: ${report.maturityLevel}`, margin + 60, yPos + 30);

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  const descLines = wrapText(report.maturityDescription, contentWidth - 70);
  descLines.forEach((line, i) => {
    doc.text(line, margin + 60, yPos + 38 + i * 5);
  });

  yPos += 60;

  // Score Breakdown
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Score Breakdown by Pillar", margin, yPos);
  yPos += 10;

  const pillars = [
    { name: "Content", score: report.scores.content, weight: "30%" },
    { name: "Technical", score: report.scores.technical, weight: "25%" },
    { name: "Authority", score: report.scores.authority, weight: "25%" },
    { name: "Measurement", score: report.scores.measurement, weight: "20%" },
  ];

  const pillarWidth = (contentWidth - 15) / 4;
  pillars.forEach((pillar, index) => {
    const x = margin + index * (pillarWidth + 5);
    const color = getPillarColor(pillar.name);

    doc.setFillColor(...color);
    doc.roundedRect(x, yPos, pillarWidth, 25, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(pillar.name, x + 5, yPos + 8);

    doc.setFontSize(14);
    doc.text(`${pillar.score.toFixed(1)}/5`, x + 5, yPos + 18);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`(${pillar.weight})`, x + pillarWidth - 15, yPos + 18);
  });

  yPos += 35;

  // What You're Doing Right
  if (report.strengths && report.strengths.length > 0) {
    checkPageBreak(30);

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("What You're Doing Right", margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("These elements help AI systems discover and cite your content:", margin, yPos);
    yPos += 8;

    report.strengths.slice(0, 6).forEach((strength) => {
      checkPageBreak(15);

      const color = getPillarColor(strength.category);
      doc.setFillColor(...color);
      doc.circle(margin + 3, yPos + 2, 2, "F");

      doc.setTextColor(...COLORS.text);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(strength.title, margin + 8, yPos + 3);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.muted);
      const lines = wrapText(strength.description, contentWidth - 10);
      lines.forEach((line, i) => {
        doc.text(line, margin + 8, yPos + 8 + i * 4);
      });

      yPos += 10 + lines.length * 4;
    });
  }

  yPos += 5;

  // Your Next Steps (Recommendations by Pillar)
  checkPageBreak(30);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Your Next Steps", margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text("Focus on these improvements to boost your AI visibility:", margin, yPos);
  yPos += 10;

  const pillarOrder: (keyof typeof report.recommendationsByPillar)[] = [
    "Content",
    "Technical",
    "Authority",
    "Measurement",
  ];

  pillarOrder.forEach((pillarName) => {
    const recommendations = report.recommendationsByPillar[pillarName];
    if (!recommendations || recommendations.length === 0) return;

    checkPageBreak(25);

    const color = getPillarColor(pillarName);
    doc.setFillColor(...color);
    doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${pillarName} Improvements`, margin + 5, yPos + 5.5);
    yPos += 12;

    recommendations.forEach((rec: AEORecommendation, index: number) => {
      checkPageBreak(25);

      doc.setTextColor(...COLORS.text);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${rec.title}`, margin + 5, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.muted);
      const descLines = wrapText(rec.description, contentWidth - 15);
      descLines.forEach((line) => {
        doc.text(line, margin + 5, yPos);
        yPos += 4;
      });

      if (rec.why) {
        doc.setFontSize(8);
        doc.setTextColor(...color);
        const whyLines = wrapText(`Why: ${rec.why}`, contentWidth - 20);
        whyLines.forEach((line) => {
          doc.text(line, margin + 10, yPos);
          yPos += 4;
        });
      }

      yPos += 3;
    });

    yPos += 5;
  });

  // AEO Maturity Model
  checkPageBreak(50);
  yPos += 5;

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Understanding the AEO Maturity Model", margin, yPos);
  yPos += 10;

  const maturityLevels = [
    { level: "5 - Authority", desc: "AI systems actively recommend and cite your brand" },
    { level: "4 - Pillar", desc: "Comprehensive content ecosystem with strong authority signals" },
    { level: "3 - Structure", desc: "Well-organized content with technical foundations in place" },
    { level: "2 - Answers", desc: "Beginning to structure content for AI consumption" },
    { level: "1 - Keywords", desc: "Traditional SEO approach, not yet optimized for AI" },
  ];

  maturityLevels.forEach((item, index) => {
    const isCurrentLevel = report.maturityLevel === item.level.split(" - ")[1];

    if (isCurrentLevel) {
      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(margin, yPos - 3, contentWidth, 10, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(...COLORS.text);
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(item.level, margin + 5, yPos + 3);

    doc.setFont("helvetica", "normal");
    if (!isCurrentLevel) doc.setTextColor(...COLORS.muted);
    doc.text(item.desc, margin + 45, yPos + 3);

    yPos += 12;
  });

  // Footer
  const footerY = pageHeight - 15;
  doc.setDrawColor(...COLORS.light);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.text("Ready to improve your AEO score? Schedule a free consultation at upclicklabs.com", margin, footerY);
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 15, footerY);

  return doc;
}

export function downloadAEOReportPDF(report: AEOReport): void {
  const doc = generateAEOReportPDF(report);
  const filename = `aeo-report-${new URL(report.url).hostname}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
