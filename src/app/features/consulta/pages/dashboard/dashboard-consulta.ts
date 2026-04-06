import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConsultaService, EstadisticasOut } from '../../../../core/services/consulta.service';

@Component({
  selector: 'app-dashboard-consulta',
  templateUrl: './dashboard-consulta.html',
  standalone: false
})
export class DashboardConsultaComponent implements OnInit {
  stats?: EstadisticasOut;
  cargando = true;

  constructor(
    private consulta: ConsultaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.consulta.estadisticas().subscribe({
      next:  s  => { this.stats = s; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  maxTotal(items: { label: string; total: number }[]): number {
    return Math.max(...items.map(i => i.total), 1);
  }

  barWidth(total: number, max: number): string {
    return `${Math.round((total / max) * 100)}%`;
  }
}
