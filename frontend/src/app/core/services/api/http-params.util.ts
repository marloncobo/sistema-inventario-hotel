import { HttpParams } from '@angular/common/http';

type ParamValue = string | number | boolean | null | undefined;

export function buildHttpParams<T extends object>(values: T): HttpParams {
  let params = new HttpParams();

  Object.entries(values as Record<string, ParamValue>).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    params = params.set(key, String(value));
  });

  return params;
}
