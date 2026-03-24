import { Component, OnInit } from '@angular/core';
import { AdminService, CanalOut } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-canales',
  templateUrl: './canales.html',
  standalone: false
})
export class CanalesComponent implements OnInit {
  canales: CanalOut[] = [];

  iconos: Record<string, string> = {
    presencial: 'storefront',
    digital:    'language',
    email:      'email',
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.adminService.getCanales().subscribe(c => this.canales = c); }

  toggleCanal(canal: CanalOut): void {
    this.adminService.actualizarCanal(canal.id, { activo: !canal.activo })
      .subscribe(c => {
        const idx = this.canales.findIndex(x => x.id === c.id);
        if (idx >= 0) this.canales[idx] = c;
      });
  }
}
