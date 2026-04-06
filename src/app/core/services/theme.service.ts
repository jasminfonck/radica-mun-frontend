import { Injectable } from '@angular/core';

const STORAGE_KEY = 'radica_color_primario';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  constructor() {
    // Aplica el color guardado antes de que cualquier componente renderice.
    // Esto cubre el login y cualquier recarga de página.
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) this._aplicar(guardado);
  }

  aplicarColor(hex: string): void {
    if (!this.esHexValido(hex)) return;
    this._aplicar(hex);
    localStorage.setItem(STORAGE_KEY, hex);
  }

  private _aplicar(hex: string): void {
    const root = document.documentElement;
    root.style.setProperty('--azul',       hex);
    root.style.setProperty('--azul-deep',  this.ajustar(hex, 0.70));
    root.style.setProperty('--azul-hover', this.ajustar(hex, 1.18));
    root.style.setProperty('--azul-pale',  this.rgba(hex, 0.12));
    root.style.setProperty('--azul-pale2', this.rgba(hex, 0.07));
  }

  private esHexValido(hex: string): boolean {
    return !!hex && /^#[0-9A-Fa-f]{6}$/.test(hex);
  }

  private ajustar(hex: string, factor: number): string {
    const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
    const r = clamp(parseInt(hex.slice(1, 3), 16) * factor);
    const g = clamp(parseInt(hex.slice(3, 5), 16) * factor);
    const b = clamp(parseInt(hex.slice(5, 7), 16) * factor);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  private rgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
