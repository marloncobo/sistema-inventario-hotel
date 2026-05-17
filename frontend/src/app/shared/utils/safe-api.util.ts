import { HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { silentHttpContext } from '@core/http/silent-http.context';

/** Evita que un 403/500 en datos auxiliares tumbe un forkJoin completo. */
export function emptyArrayOnError<T>(): (source: Observable<T[]>) => Observable<T[]> {
  return (source) => source.pipe(catchError(() => of([] as T[])));
}

/** Contexto HTTP para cargas de apoyo (catálogos, listas en formularios). */
export function auxiliaryHttpContext(): HttpContext {
  return silentHttpContext();
}

export function emptyOnError<T>(fallback: T): (source: Observable<T>) => Observable<T> {
  return (source) => source.pipe(catchError(() => of(fallback)));
}
