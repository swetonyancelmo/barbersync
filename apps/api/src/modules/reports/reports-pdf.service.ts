import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { ReportSummary } from '@barbersync/shared';

// Paleta do design system "Azulejaria" (tema claro) para o cabeçalho do PDF.
const POLE = '#C0392B';
const CREAM = '#F3ECD9';
const NAVY = '#1F3A5F';
const PINE = '#1E3A33';
const INK = '#26241C';
const SLATE = '#6E6A5B';
const LINE = '#D9D5C4';

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const PERIODO_LABEL = { dia: 'Dia', semana: 'Semana', mes: 'Mês' } as const;

/** Logo oficial (kit barbersync-brand), 434:120. src/assets → dist/assets via nest-cli. */
const LOGO_ALTURA = 26;
const LOGO_LARGURA = (LOGO_ALTURA * 434) / 120;
const LOGO = carregarLogo();

function carregarLogo(): Buffer | null {
  try {
    return readFileSync(join(__dirname, '..', '..', 'assets', 'brand', 'barbersync-logo-horizontal-light-bg-h128.png'));
  } catch (err) {
    // Sem a logo o relatório continua saindo — só sem a marca no cabeçalho.
    new Logger('ReportsPdfService').warn(`Logo do PDF não encontrada: ${(err as Error).message}`);
    return null;
  }
}

@Injectable()
export class ReportsPdfService {
  /** Gera o PDF do resumo — mesmos números da tela (recebe o mesmo ReportSummary). */
  buildSummaryPdf(summary: ReportSummary, barbeariaNome: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.header(doc, summary, barbeariaNome);
      this.kpis(doc, summary);

      this.tabela(doc, 'Recebido por barbeiro', ['Barbeiro', 'Atendimentos', 'Recebido'], summary.porBarbeiro.map((b) => [b.nome, String(b.atendimentos), brl(b.recebido)]), [0.5, 0.25, 0.25]);
      this.tabela(doc, 'Clientes mais fiéis', ['Cliente', 'Atendimentos', 'Total gasto', 'Tier'], summary.topClientes.map((c) => [c.nome, String(c.atendimentos), brl(c.totalGasto), c.tier]), [0.4, 0.2, 0.22, 0.18]);
      this.tabela(doc, 'Serviços mais usados (receita pelo preço atual)', ['Serviço', 'Vezes', 'Receita aprox.'], summary.topServicos.map((s) => [s.nome, String(s.vezes), brl(s.receitaAprox)]), [0.5, 0.25, 0.25]);

      doc.end();
    });
  }

  private header(doc: PDFKit.PDFDocument, summary: ReportSummary, barbeariaNome: string) {
    // Faixa do poste de barbeiro no topo (vermelho / creme / azul).
    doc.rect(0, 0, PAGE_WIDTH, 6).fill(POLE);
    doc.rect(0, 6, PAGE_WIDTH, 4).fill(CREAM);
    doc.rect(0, 10, PAGE_WIDTH, 4).fill(NAVY);

    if (LOGO) {
      doc.image(LOGO, PAGE_WIDTH - MARGIN - LOGO_LARGURA, MARGIN - 2, { height: LOGO_ALTURA });
    }
    // Largura reservada p/ o texto não passar por baixo da logo.
    const larguraTexto = LOGO ? CONTENT_WIDTH - LOGO_LARGURA - 16 : CONTENT_WIDTH;

    doc.y = MARGIN;
    doc.fillColor(PINE).font('Helvetica-Bold').fontSize(18).text(barbeariaNome, MARGIN, MARGIN, { width: larguraTexto });
    doc.moveDown(0.2);
    doc.fillColor(INK).fontSize(13).text(`Relatório — ${PERIODO_LABEL[summary.periodo.tipo]}`, { width: larguraTexto });
    doc.moveDown(0.2);
    const inicio = new Date(summary.periodo.inicio);
    const fim = new Date(new Date(summary.periodo.fim).getTime() - 86_400_000);
    const f = (d: Date) => d.toLocaleDateString('pt-BR');
    const periodoTxt =
      summary.periodo.tipo === 'dia' ? f(inicio) : `${f(inicio)} a ${f(fim)}`;
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(SLATE)
      .text(`Período: ${periodoTxt}   ·   Gerado em ${new Date().toLocaleString('pt-BR')}`);
    doc.moveDown(1.2);
  }

  private kpis(doc: PDFKit.PDFDocument, summary: ReportSummary) {
    const k = summary.kpis;
    const col = CONTENT_WIDTH / 3;
    const y = doc.y;
    const items = [
      ['RECEBIDO', brl(k.recebido)],
      ['ATENDIMENTOS CONCLUÍDOS', String(k.atendimentosConcluidos)],
      ['TICKET MÉDIO', brl(k.ticketMedio)],
    ];
    items.forEach(([label, valor], i) => {
      const x = MARGIN + i * col;
      doc.font('Helvetica').fontSize(8).fillColor(SLATE).text(label, x, y, { width: col });
      doc.font('Helvetica-Bold').fontSize(16).fillColor(INK).text(valor, x, y + 12, { width: col });
    });
    doc.y = y + 44;
    doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor(LINE).stroke();
    doc.moveDown(1);
  }

  private tabela(
    doc: PDFKit.PDFDocument,
    titulo: string,
    headers: string[],
    rows: string[][],
    widths: number[],
  ) {
    doc.x = MARGIN;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(PINE).text(titulo);
    doc.moveDown(0.5);

    if (rows.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(SLATE).text('Sem dados no período.');
      doc.moveDown(1.2);
      return;
    }

    const cols = widths.map((w) => w * CONTENT_WIDTH);
    const rowHeight = 20;

    const drawRow = (cells: string[], y: number, bold: boolean) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(INK);
      let x = MARGIN;
      cells.forEach((cell, i) => {
        doc.text(cell, x + 2, y + 5, { width: cols[i] - 6, ellipsis: true, lineBreak: false });
        x += cols[i];
      });
    };

    let y = doc.y;
    drawRow(headers, y, true);
    y += rowHeight;
    doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(LINE).stroke();

    for (const row of rows) {
      // Quebra de página se a linha não couber.
      if (y + rowHeight > doc.page.height - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
      drawRow(row, y, false);
      y += rowHeight;
      doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(LINE).stroke();
    }
    doc.y = y;
    doc.x = MARGIN;
    doc.moveDown(1.2);
  }
}

function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}
