import jsPDF from 'jspdf';
import type { FooterConfig, HeaderConfig, PageSetup, TableConfig } from './types';
import { loadLogo } from './utils/loadLogo';

const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 190;
const BOTTOM_MARGIN = 30;
const SECTION_BG: [number, number, number] = [248, 250, 252];

export class PdfDocument {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private yPos = 55;
  private marginLeft: number;
  private marginRight: number;
  private bottomMargin: number;
  private footerConfig: FooterConfig | null = null;

  constructor(setup: PageSetup = {}) {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.marginLeft = setup.marginLeft ?? MARGIN_LEFT;
    this.marginRight = setup.marginRight ?? MARGIN_RIGHT;
    this.bottomMargin = setup.bottomMargin ?? BOTTOM_MARGIN;
  }

  async addHeader(config: HeaderConfig): Promise<this> {
    const { title, subtitle, logoPath, rightAlignedCompanyInfo, companyLines } = config;

    if (logoPath) {
      const logoDataUrl = await loadLogo(logoPath);
      if (logoDataUrl) {
        if (rightAlignedCompanyInfo) {
          this.doc.addImage(logoDataUrl, 'PNG', this.marginLeft, 10, 40, 15);
        } else {
          this.doc.addImage(logoDataUrl, 'PNG', 15, 15, 15, 15);
        }
      }
    }

    if (rightAlignedCompanyInfo && companyLines) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      companyLines.forEach((line, i) => {
        this.doc.text(line, this.pageWidth - this.marginLeft - 60, 15 + i * 7);
      });
      this.doc.setLineWidth(0.5);
      this.doc.line(this.marginLeft, 30, this.pageWidth - this.marginLeft, 30);
      this.yPos = 40;

      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(title, this.marginLeft, this.yPos);
      this.yPos += 15;
    } else {
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(title, this.marginLeft, 35);

      if (subtitle) {
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(subtitle, this.marginLeft, 42);
      }
      this.yPos = 55;
    }

    return this;
  }

  addSection(title: string): this {
    this.guardPageBreak(15);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFillColor(...SECTION_BG);
    this.doc.rect(this.marginLeft, this.yPos, this.marginRight - this.marginLeft, 8, 'F');
    this.doc.text(title, this.marginLeft + 2, this.yPos + 5.5);
    this.yPos += 15;
    return this;
  }

  addField(label: string, value: string | number | null | undefined): this {
    const text = value != null ? String(value) : '-';
    this.guardPageBreak(10);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${label}:`, this.marginLeft, this.yPos);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(text, 80);
    this.doc.text(lines, this.marginLeft, this.yPos + 4);
    this.yPos += lines.length * 4 + 6;
    return this;
  }

  addText(text: string, maxWidth = 160): this {
    this.guardPageBreak(10);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(text, maxWidth);
    this.doc.text(lines, this.marginLeft, this.yPos + 4);
    this.yPos += lines.length * 4 + 6;
    return this;
  }

  addTable(config: TableConfig): this {
    const { columns, rows } = config;
    this.guardPageBreak(15);

    const xPositions = this.calcColumnX(columns);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    columns.forEach((col, i) => {
      const align = col.align ?? 'left';
      this.doc.text(col.header, xPositions[i], this.yPos, { align });
    });
    this.yPos += 6;

    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.marginLeft, this.yPos, this.marginRight, this.yPos);
    this.yPos += 8;

    this.doc.setFont('helvetica', 'normal');
    rows.forEach((row) => {
      if (this.yPos > this.pageHeight - 40) {
        this.doc.addPage();
        this.yPos = 20;
      }
      columns.forEach((col, i) => {
        const val = row[col.key] != null ? String(row[col.key]) : '';
        const align = col.align ?? 'left';
        this.doc.text(val, xPositions[i], this.yPos, { align });
      });
      this.yPos += 8;
    });

    this.yPos += 5;
    return this;
  }

  addWatermark(text: string): this {
    this.doc.setFontSize(50);
    this.doc.setTextColor(200, 200, 200);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.pageWidth / 2, this.pageHeight / 2, { angle: 45, align: 'center' });
    this.doc.setTextColor(0, 0, 0);
    return this;
  }

  /** Call once before save/toBlob to stamp footer + page numbers on all pages. */
  setFooter(config: FooterConfig): this {
    this.footerConfig = config;
    return this;
  }

  /** Advance yPos by a fixed amount. */
  addSpacing(amount = 6): this {
    this.yPos += amount;
    return this;
  }

  /** Draw a horizontal rule. */
  addDivider(): this {
    this.guardPageBreak(5);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.marginLeft, this.yPos, this.marginRight, this.yPos);
    this.yPos += 8;
    return this;
  }

  /** Add a custom drawing callback for advanced content (e.g. SVG circles in timelines). */
  addCustom(callback: (doc: jsPDF, yPos: number, marginLeft: number) => number): this {
    this.yPos = callback(this.doc, this.yPos, this.marginLeft);
    return this;
  }

  save(filename: string): void {
    this.stampFooters();
    this.doc.save(filename);
  }

  toBlob(): Promise<Blob> {
    this.stampFooters();
    return Promise.resolve(this.doc.output('blob'));
  }

  // ── private ─────────────────────────────────────────────────────────────────

  private guardPageBreak(needed: number): void {
    if (this.yPos + needed > this.pageHeight - this.bottomMargin) {
      this.doc.addPage();
      this.yPos = 20;
    }
  }

  private calcColumnX(columns: TableConfig['columns']): number[] {
    const totalWidth = this.marginRight - this.marginLeft;
    const fixedWidths = columns.reduce((sum, c) => sum + (c.width ?? 0), 0);
    const freeWidth = totalWidth - fixedWidths;
    const freeCols = columns.filter((c) => !c.width).length;
    const autoWidth = freeCols > 0 ? freeWidth / freeCols : 0;

    let x = this.marginLeft;
    return columns.map((col) => {
      const colWidth = col.width ?? autoWidth;
      const pos = col.align === 'right' ? x + colWidth : x;
      x += colWidth;
      return pos;
    });
  }

  private stampFooters(): void {
    if (!this.footerConfig) return;
    const { lines } = this.footerConfig;
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(this.marginLeft, this.pageHeight - 25, this.marginRight, this.pageHeight - 25);
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      lines.forEach((line, idx) => {
        this.doc.text(line, this.marginLeft, this.pageHeight - 18 + idx * 6);
      });
      this.doc.text(`Page ${i} of ${pageCount}`, 170, this.pageHeight - 12);
      this.doc.setTextColor(0, 0, 0);
    }
  }
}
