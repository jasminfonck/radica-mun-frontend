import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecepcionService } from '../../../../core/services/recepcion.service';
import { AdminService, CanalOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-nueva-recepcion',
  templateUrl: './nueva-recepcion.html',
  styleUrls: ['./nueva-recepcion.scss'],
  standalone: false
})
export class NuevaRecepcionComponent implements OnInit {
  form!: FormGroup;
  canales: CanalOut[] = [];
  archivosSeleccionados: File[] = [];
  guardando = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private recepcionService: RecepcionService,
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      canal_id:           [null, Validators.required],
      asunto_provisional: [''],
      observaciones:      [''],
      email_remitente:    ['', Validators.email],
    });
    this.adminService.getCanales().subscribe(c => this.canales = c.filter(x => x.activo));
  }

  get canalSeleccionado(): CanalOut | undefined {
    return this.canales.find(c => c.id === this.form.get('canal_id')?.value);
  }

  get esCanaleEmail(): boolean {
    return this.canalSeleccionado?.tipo === 'email';
  }

  seleccionarArchivos(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.archivosSeleccionados = [...this.archivosSeleccionados, ...Array.from(input.files)];
    }
  }

  quitarArchivo(index: number): void {
    this.archivosSeleccionados.splice(index, 1);
  }

  formatoTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    this.error = '';

    const payload = { ...this.form.value };
    if (!payload.email_remitente) delete payload.email_remitente;

    this.recepcionService.crear(payload).subscribe({
      next: async (recepcion) => {
        // Subir adjuntos uno a uno
        for (const archivo of this.archivosSeleccionados) {
          await this.recepcionService.subirAdjunto(recepcion.id, archivo).toPromise();
        }
        this.router.navigate(['/recepcion', recepcion.id]);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al registrar la recepción';
        this.guardando = false;
      }
    });
  }
}
