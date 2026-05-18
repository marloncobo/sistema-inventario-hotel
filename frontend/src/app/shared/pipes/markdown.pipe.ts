import { Pipe, PipeTransform } from '@angular/core';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure marked once when the module is loaded.
marked.use({ breaks: true, gfm: true });

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) {
      return '';
    }

    try {
      // Keep the pipe synchronous and return only plain HTML strings.
      const rendered = marked.parse(value, { async: false });
      const html = typeof rendered === 'string'
        ? rendered
        : this.escapeHtml(value);
      const sanitized = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true }
      });

      return this.decorateHtml(sanitized);
    } catch {
      return this.escapeHtml(value);
    }
  }

  private decorateHtml(html: string): string {
    if (typeof document === 'undefined') {
      return html;
    }

    const template = document.createElement('template');
    template.innerHTML = html;

    this.decorateTables(template.content);
    this.decorateStandaloneBlocks(template.content);

    template.content.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('http://') || href.startsWith('https://')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return template.innerHTML;
  }

  private decorateTables(root: DocumentFragment): void {
    root.querySelectorAll('table').forEach((table) => {
      const columnCount = table.querySelector('tr')?.children.length ?? 0;
      let hasRichContent = false;

      table.classList.add(
        'markdown-table',
        columnCount >= 6 ? 'markdown-table--compact' : 'markdown-table--detail',
        `markdown-table--cols-${Math.min(Math.max(columnCount, 1), 8)}`
      );

      table.querySelectorAll('th, td').forEach((cell) => {
        const tableCell = cell as HTMLTableCellElement;
        hasRichContent = this.decorateTableCell(tableCell) || hasRichContent;
        hasRichContent = this.isVerboseCell(tableCell) || hasRichContent;
        this.decorateCellSemantics(tableCell);
      });

      if (hasRichContent) {
        table.classList.add('markdown-table--rich');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'markdown-table-wrap';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  private decorateStandaloneBlocks(root: DocumentFragment): void {
    root.querySelectorAll('p, blockquote').forEach((element) => {
      if (element.closest('table') || !element.innerHTML.toLowerCase().includes('<br')) {
        return;
      }

      const fragment = this.buildStructuredFragment(this.splitHtmlByBreaks(element.innerHTML), 'p');
      if (!fragment) {
        return;
      }

      element.parentNode?.insertBefore(fragment, element);
      element.remove();
    });
  }

  private decorateTableCell(cell: HTMLTableCellElement): boolean {
    const fragment = this.buildStructuredFragment(this.splitHtmlByBreaks(cell.innerHTML), 'p');
    if (!fragment) {
      return false;
    }

    cell.innerHTML = '';
    cell.appendChild(fragment);
    return true;
  }

  private buildStructuredFragment(parts: string[], textTag: 'p' | 'div'): DocumentFragment | null {
    if (parts.length <= 1) {
      return null;
    }

    const fragment = document.createDocumentFragment();
    let currentList: HTMLOListElement | HTMLUListElement | null = null;
    let currentListType: 'ol' | 'ul' | null = null;
    let hasMeaningfulStructure = false;

    parts.forEach((part) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) {
        return;
      }

      const plainText = this.toPlainText(trimmedPart);
      const unorderedMatch = plainText.match(/^[-*•]\s+/);
      const orderedMatch = plainText.match(/^\d+[.)]\s+/);

      if (unorderedMatch || orderedMatch) {
        const listType: 'ol' | 'ul' = orderedMatch ? 'ol' : 'ul';
        if (currentListType !== listType || currentList == null) {
          currentList = document.createElement(listType);
          currentList.className = 'markdown-table-list';
          fragment.appendChild(currentList);
          currentListType = listType;
        }

        const li = document.createElement('li');
        li.innerHTML = trimmedPart.replace(/^(\s*[-*•]\s+|\s*\d+[.)]\s+)/, '');
        currentList.appendChild(li);
        hasMeaningfulStructure = true;
        return;
      }

      currentList = null;
      currentListType = null;

      const block = document.createElement(textTag);
      block.innerHTML = trimmedPart;
      fragment.appendChild(block);
      hasMeaningfulStructure = true;
    });

    return hasMeaningfulStructure ? fragment : null;
  }

  private decorateCellSemantics(cell: HTMLTableCellElement): void {
    const text = this.toPlainText(cell.innerHTML).trim();
    if (!text) {
      return;
    }

    const blockCount = cell.querySelectorAll(':scope > p, :scope > ul, :scope > ol').length;
    const isRichCell = blockCount > 1 || text.length >= 96;

    if (/^-?\d+(?:[.,]\d+)?%?$/.test(text)) {
      cell.classList.add('is-numeric');
    }

    if (/^[A-Z]{2,5}-\d{2,4}$/i.test(text)) {
      cell.classList.add('is-code');
    }

    if (isRichCell) {
      cell.classList.add('markdown-table-cell--rich');
      this.decorateLeadingStatusBlock(cell);
      return;
    }

    if (this.isStatusLabel(text)) {
      cell.classList.add('is-status', 'is-status-only');
      this.wrapStatusContent(cell, text);
      return;
    }

    this.decorateLeadingStatusBlock(cell);
  }

  private decorateLeadingStatusBlock(cell: HTMLTableCellElement): void {
    const firstBlock = cell.querySelector(':scope > p:first-child');
    if (!firstBlock || firstBlock.querySelector('.status-pill')) {
      return;
    }

    const firstText = this.toPlainText(firstBlock.innerHTML).trim();
    if (!this.isStatusLabel(firstText)) {
      return;
    }

    const pill = document.createElement('span');
    pill.className = `status-pill status-pill--${this.resolveStatusTone(firstText)}`;
    pill.textContent = firstText;
    firstBlock.innerHTML = '';
    firstBlock.appendChild(pill);
    firstBlock.classList.add('markdown-table-status-line');
  }

  private isStatusLabel(text: string): boolean {
    const normalized = text.trim();
    if (!normalized || normalized.length > 48) {
      return false;
    }

    const known =
      /^(activo|inactivo|ocupada|disponible|pendiente|cerrada|abierta|critico|crítico|alto|medio|bajo|bajo stock|completa|parcial|no disponibles?|no incluida|incluida|n\/a|na|sí|si|no)$/i;
    if (known.test(normalized)) {
      return true;
    }

    return (
      normalized.length >= 3 &&
      normalized.length <= 40 &&
      normalized === normalized.toUpperCase() &&
      /^[A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑ0-9\s./-]+$/.test(normalized)
    );
  }

  private isVerboseCell(cell: HTMLTableCellElement): boolean {
    const text = this.toPlainText(cell.innerHTML);
    return text.length >= 110 || cell.querySelectorAll('p, ul, ol').length > 1;
  }

  private splitHtmlByBreaks(html: string): string[] {
    return html
      .split(/<br\s*\/?>/i)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private toPlainText(html: string): string {
    const element = document.createElement('div');
    element.innerHTML = html;
    return element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  private wrapStatusContent(cell: HTMLTableCellElement, text: string): void {
    if (cell.children.length > 0 && cell.querySelector('.status-pill')) {
      return;
    }

    const tone = this.resolveStatusTone(text);
    const pill = document.createElement('span');
    pill.className = `status-pill status-pill--${tone}`;
    pill.textContent = text;
    cell.innerHTML = '';
    cell.appendChild(pill);
  }

  private resolveStatusTone(text: string): string {
    const normalized = text.trim().toLowerCase();
    if (
      normalized.includes('no disponible') ||
      normalized.includes('no incluida') ||
      normalized === 'no' ||
      normalized === 'critico' ||
      normalized === 'crítico' ||
      normalized === 'cerrada' ||
      normalized === 'bajo' ||
      normalized === 'bajo stock'
    ) {
      return 'danger';
    }
    if (
      normalized === 'alto' ||
      normalized === 'pendiente' ||
      normalized === 'ocupada' ||
      normalized === 'parcial' ||
      normalized === 'medio'
    ) {
      return 'warning';
    }
    if (normalized === 'inactivo' || normalized === 'n/a' || normalized === 'na') {
      return 'neutral';
    }
    return 'success';
  }

  private escapeHtml(value: string): string {
    return `<p>${value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</p>`;
  }
}
