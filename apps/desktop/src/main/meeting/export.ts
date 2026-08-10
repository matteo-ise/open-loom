import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { library } from '../library';

export async function exportMeetingToPdf(videoId: string, outputPath: string): Promise<void> {
  const store = library();
  const meta = store.get(videoId);
  if (!meta.meeting) throw new Error('No meeting summary available to export.');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  let cursorY = height - 50;

  const writeLine = (text: string, isBold = false, size = 12) => {
    if (cursorY < 50) {
      page = pdfDoc.addPage();
      cursorY = height - 50;
    }
    page.drawText(text, { x: 50, y: cursorY, size, font: isBold ? boldFont : font, color: rgb(0, 0, 0) });
    cursorY -= (size + 4);
  };

  const writeMultiline = (text: string, isBold = false, size = 12) => {
    const lines = text.split('\n');
    for (const line of lines) {
      // Very basic text wrapping (could be improved)
      const words = line.split(' ');
      let currentLine = '';
      for (const word of words) {
        if (currentLine.length + word.length > 80) {
          writeLine(currentLine, isBold, size);
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
      if (currentLine.trim()) writeLine(currentLine.trim(), isBold, size);
    }
  };

  writeLine(`Meeting: ${meta.title}`, true, 18);
  writeLine(`Date: ${new Date(meta.createdAt).toLocaleString()}`, false, 10);
  cursorY -= 20;

  writeLine('Summary', true, 14);
  writeMultiline(meta.meeting.summary);
  cursorY -= 10;

  writeLine('Key Outcomes', true, 14);
  for (const outcome of meta.meeting.keyOutcomes) {
    writeMultiline(`• ${outcome}`);
  }
  cursorY -= 10;

  writeLine('Next Steps', true, 14);
  for (const step of meta.meeting.nextSteps) {
    writeMultiline(`• ${step}`);
  }
  cursorY -= 10;

  writeLine('Transcript', true, 14);
  writeMultiline(meta.meeting.transcriptDiarized, false, 10);

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

export async function exportMeetingToDocx(videoId: string, outputPath: string): Promise<void> {
  const store = library();
  const meta = store.get(videoId);
  if (!meta.meeting) throw new Error('No meeting summary available to export.');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: `Meeting: ${meta.title}`, heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `Date: ${new Date(meta.createdAt).toLocaleString()}` }),
          
          new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: meta.meeting.summary }),

          new Paragraph({ text: 'Key Outcomes', heading: HeadingLevel.HEADING_1 }),
          ...meta.meeting.keyOutcomes.map((o) => new Paragraph({ text: o, bullet: { level: 0 } })),

          new Paragraph({ text: 'Next Steps', heading: HeadingLevel.HEADING_1 }),
          ...meta.meeting.nextSteps.map((s) => new Paragraph({ text: s, bullet: { level: 0 } })),

          new Paragraph({ text: 'Transcript', heading: HeadingLevel.HEADING_1 }),
          ...meta.meeting.transcriptDiarized.split('\n').map((line) => new Paragraph({ text: line })),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

export function exportMeetingToTxt(videoId: string, outputPath: string): void {
  const store = library();
  const meta = store.get(videoId);
  if (!meta.meeting) throw new Error('No meeting summary available to export.');

  const txt = [
    `Meeting: ${meta.title}`,
    `Date: ${new Date(meta.createdAt).toLocaleString()}`,
    '',
    '## Summary',
    meta.meeting.summary,
    '',
    '## Key Outcomes',
    ...meta.meeting.keyOutcomes.map((o) => `- ${o}`),
    '',
    '## Next Steps',
    ...meta.meeting.nextSteps.map((s) => `- ${s}`),
    '',
    '## Transcript',
    meta.meeting.transcriptDiarized,
  ].join('\n');

  fs.writeFileSync(outputPath, txt);
}
