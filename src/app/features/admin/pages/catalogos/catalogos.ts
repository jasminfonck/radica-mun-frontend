import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, TipoReqOut, PlazoOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-catalogos',
  templateUrl: './catalogos.html',
  standalone: false
})
export class CatalogosComponent implements OnInit {
  tipos: TipoReqOut[] = [];
  plazos: PlazoOut[] = [];
  tabActiva = 0;

  formTipo!: FormGroup;
  formPlazo!: FormGroup;
  editandoTipo: TipoReqOut | null = null;
  editandoPlazo: PlazoOut | null = null;
  mostrarFormTipo = false;
  mostrarFormPlazo = false;

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.inicializarForms();
    this.cargar();
  }

  inicializarForms(tipo?: TipoReqOut, plazo?: PlazoOut): void {
    this.formTipo  = this.fb.group({ nombre: [tipo?.nombre  || '', Validators.required], descripcion: [tipo?.descripcion  || ''] });
    this.formPlazo = this.fb.group({ nombre: [plazo?.nombre || '', Validators.required], dias_habiles: [plazo?.dias_habiles || '', [Validators.required, Validators.min(1)]] });
  }

  cargar(): void {
    this.adminService.getTipos().subscribe(t => this.tipos = t);
    this.adminService.getPlazos().subscribe(p => this.plazos = p);
  }

  guardarTipo(): void {
    if (this.formTipo.invalid) return;
    const obs = this.editandoTipo
      ? this.adminService.actualizarTipo(this.editandoTipo.id, this.formTipo.value)
      : this.adminService.crearTipo(this.formTipo.value);
    obs.subscribe(() => { this.cargar(); this.mostrarFormTipo = false; this.editandoTipo = null; this.inicializarForms(); });
  }

  guardarPlazo(): void {
    if (this.formPlazo.invalid) return;
    const obs = this.editandoPlazo
      ? this.adminService.actualizarPlazo(this.editandoPlazo.id, this.formPlazo.value)
      : this.adminService.crearPlazo(this.formPlazo.value);
    obs.subscribe(() => { this.cargar(); this.mostrarFormPlazo = false; this.editandoPlazo = null; this.inicializarForms(); });
  }

  editarTipo(t: TipoReqOut): void  { this.editandoTipo = t; this.inicializarForms(t); this.mostrarFormTipo = true; }
  editarPlazo(p: PlazoOut): void   { this.editandoPlazo = p; this.inicializarForms(undefined, p); this.mostrarFormPlazo = true; }
  toggleTipo(t: TipoReqOut): void  { this.adminService.actualizarTipo(t.id, { activo: !t.activo }).subscribe(() => this.cargar()); }
  togglePlazo(p: PlazoOut): void   { this.adminService.actualizarPlazo(p.id, { activo: !p.activo }).subscribe(() => this.cargar()); }
}
