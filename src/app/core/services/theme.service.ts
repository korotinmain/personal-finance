import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'pf-theme';

  getTheme(): ThemeMode {
    const saved = localStorage.getItem(this.storageKey);
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  }

  applyTheme(theme: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);
  }

  toggleTheme(): ThemeMode {
    const next: ThemeMode = this.getTheme() === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
    return next;
  }
}
