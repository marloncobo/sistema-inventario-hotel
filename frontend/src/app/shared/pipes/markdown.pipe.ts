import { Pipe, PipeTransform } from '@angular/core';
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
      return typeof rendered === 'string'
        ? rendered
        : `<p>${value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    } catch {
      return `<p>${value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }
  }
}
