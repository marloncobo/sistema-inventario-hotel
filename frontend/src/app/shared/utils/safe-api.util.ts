import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Evita que un 403/500 en datos auxiliares tumbe un forkJoin completo. */
export function emptyArrayOnError<T>(): (source: Observable<T[]>) => Observable<T[]> {
  return (source) => source.pipe(catchError(() => of([] as T[])));
}

export function emptyOnError<T>(fallback: T): (source: Observable<T>) => Observable<T> {
  return (source) => source.pipe(catchError(() => of(fallback)));
}
