import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface A11yConfig {
  escalaTexto:        number;   // 100 | 115 | 130 | 150
  altoContraste:      boolean;
  interlineadoAmplio: boolean;
  fuenteLegible:      boolean;
}

const STORAGE_KEY = 'radica_a11y';

const DEFAULT: A11yConfig = {
  escalaTexto:        100,
  altoContraste:      false,
  interlineadoAmplio: false,
  fuenteLegible:      false,
};

@Component({
  selector: 'app-accessibility-widget',
  templateUrl: './accessibility-widget.component.html',
  styleUrls: ['./accessibility-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule],
})
export class AccessibilityWidgetComponent implements OnInit, OnDestroy {

  abierto = false;
  config: A11yConfig = { ...DEFAULT };

  readonly escalas = [
    { valor: 100, etiqueta: 'A',    titulo: 'Tamaño normal (100%)' },
    { valor: 115, etiqueta: 'A+',   titulo: 'Texto grande (115%)' },
    { valor: 130, etiqueta: 'A++',  titulo: 'Texto muy grande (130%)' },
    { valor: 150, etiqueta: 'A+++', titulo: 'Texto máximo (150%)' },
  ];

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) this.config = { ...DEFAULT, ...JSON.parse(saved) };
    } catch { /* localStorage no disponible (modo privado, etc.) */ }
    this._aplicar();
  }

  ngOnDestroy(): void {
    this._limpiar();
  }

  /** Escape cierra el panel sin importar el foco (SC 2.1.2) */
  @HostListener('document:keydown.escape')
  cerrar(): void {
    this.abierto = false;
  }

  togglePanel(): void {
    this.abierto = !this.abierto;
  }

  setEscala(valor: number): void {
    this.config.escalaTexto = valor;
    this._guardarYAplicar();
  }

  toggle(campo: 'altoContraste' | 'interlineadoAmplio' | 'fuenteLegible'): void {
    this.config[campo] = !this.config[campo];
    this._guardarYAplicar();
  }

  resetear(): void {
    this.config = { ...DEFAULT };
    this._guardarYAplicar();
  }

  private _guardarYAplicar(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config)); } catch {}
    this._aplicar();
  }

  private _aplicar(): void {
    const html = document.documentElement;
    const body = document.body;

    // Escala de texto: modifica font-size raíz para que rem y em escalen juntos
    html.style.fontSize = this.config.escalaTexto === 100
      ? '' : `${(16 * this.config.escalaTexto) / 100}px`;

    // Interlineado: custom property consumida por .pagina-publica en formulario-publico.scss
    if (this.config.interlineadoAmplio) {
      html.style.setProperty('--a11y-line-height', '1.9');
    } else {
      html.style.removeProperty('--a11y-line-height');
    }

    body.classList.toggle('a11y-alto-contraste', this.config.altoContraste);
    body.classList.toggle('a11y-fuente-legible',  this.config.fuenteLegible);
  }

  private _limpiar(): void {
    document.documentElement.style.fontSize = '';
    document.documentElement.style.removeProperty('--a11y-line-height');
    document.body.classList.remove('a11y-alto-contraste', 'a11y-fuente-legible');
  }
}
