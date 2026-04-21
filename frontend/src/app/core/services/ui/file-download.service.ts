import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  downloadFromResponse(
    response: HttpResponse<Blob>,
    fallbackFilename: string
  ): void {
    const body = response.body;
    if (!body) {
      return;
    }

    const filename = this.resolveFilename(
      response.headers.get('Content-Disposition'),
      fallbackFilename
    );
    const url = URL.createObjectURL(body);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  private resolveFilename(
    contentDisposition: string | null,
    fallbackFilename: string
  ): string {
    if (!contentDisposition) {
      return fallbackFilename;
    }

    const match = contentDisposition.match(/filename="?([^"]+)"?/i);
    return match?.[1] ?? fallbackFilename;
  }
}
