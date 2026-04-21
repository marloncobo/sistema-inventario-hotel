import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, inject } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a routerLink="/dashboard" class="breadcrumbs__root">Inicio</a>

      @for (crumb of breadcrumbs(); track crumb.url) {
        <span class="breadcrumbs__separator">/</span>
        <a [routerLink]="crumb.url" class="breadcrumbs__link">{{ crumb.label }}</a>
      }
    </nav>
  `,
  styles: `
    .breadcrumbs {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.35rem;
      color: #8c8073;
      font-size: 0.84rem;
    }

    .breadcrumbs__root,
    .breadcrumbs__link {
      color: inherit;
      text-decoration: none;
      transition: color 0.18s ease;
    }

    .breadcrumbs__root {
      font-weight: 700;
    }

    .breadcrumbs__root:hover,
    .breadcrumbs__link:hover {
      color: #a56c12;
    }

    .breadcrumbs__separator {
      color: rgba(161, 145, 124, 0.75);
    }
  `
})
export class BreadcrumbsComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildBreadcrumbs(this.activatedRoute.root))
    ),
    { initialValue: this.buildBreadcrumbs(this.activatedRoute.root) }
  );

  private buildBreadcrumbs(
    route: ActivatedRoute | null,
    url = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    if (!route) {
      return breadcrumbs;
    }

    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeSnapshot = child.snapshot;
      if (!routeSnapshot) {
        continue;
      }

      const routeSegment = routeSnapshot.url.map((segment) => segment.path).join('/');
      if (routeSegment !== '') {
        url += `/${routeSegment}`;
      }

      const label = routeSnapshot.data['breadcrumb'] || routeSnapshot.data['title'];

      if (label) {
        breadcrumbs.push({
          label,
          url: url || '/'
        });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
