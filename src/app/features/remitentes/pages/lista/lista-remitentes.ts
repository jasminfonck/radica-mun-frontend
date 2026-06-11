import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RemitenteService, RemitenteResumen } from '../../../../core/services/remitente.service';

@Component({
  selector: 'app-lista-remitentes',
  templateUrl: './lista-remitentes.html',
  styleUrls: ['./lista-remitentes.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaRemitentesComponent implements OnInit {
  filtros!: FormGroup;
  remitentes: RemitenteResumen[] = [];
  cargando = false;

  get columnas(): string[] {
    return this.soloActivos
      ? ['nombre_completo', 'tipo_persona', 'numero_identificacion', 'email', 'telefono', 'acciones']
      : ['nombre_completo', 'tipo_persona', 'numero_identificacion', 'email', 'telefono', 'estado', 'acciones'];
  }

  constructor(
    private fb: FormBuilder,
    private remitenteService: RemitenteService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  soloActivos = true;

  ngOnInit(): void {
    this.filtros = this.fb.group({
      q:            [''],
      tipo_persona: [''],
    });

    this.filtros.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    ).subscribe(() => this.buscar());

    this.buscar();
  }

  buscar(): void {
    this.cargando = true;
    const { q, tipo_persona } = this.filtros.value;
    this.remitenteService.buscar(q || undefined, tipo_persona || undefined, this.soloActivos)
      .subscribe({
        next: datos => {
          this.remitentes = datos;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => { this.cargando = false; this.cdr.markForCheck(); },
      });
  }

  toggleActivos(): void {
    this.soloActivos = !this.soloActivos;
    this.buscar();
  }

  editar(id: number): void {
    this.router.navigate(['/remitentes', id, 'editar']);
  }

  limpiar(): void {
    this.filtros.reset({ q: '', tipo_persona: '' });
  }
}
