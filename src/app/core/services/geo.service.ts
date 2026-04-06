import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, switchMap } from 'rxjs';

export interface DepartamentoOut {
  id: number;
  nombre: string;
}

export interface MunicipioOut {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class GeoService {
  private base = '/api/geo';

  // Cache compartido durante la vida de la sesión
  private departamentos$: Observable<DepartamentoOut[]> | null = null;

  constructor(private http: HttpClient) {}

  getDepartamentos(): Observable<DepartamentoOut[]> {
    if (!this.departamentos$) {
      this.departamentos$ = this.http
        .get<DepartamentoOut[]>(`${this.base}/departamentos`)
        .pipe(shareReplay(1));
    }
    return this.departamentos$;
  }

  getMunicipios(departamentoId: number): Observable<MunicipioOut[]> {
    return this.http.get<MunicipioOut[]>(
      `${this.base}/municipios?departamento_id=${departamentoId}`
    );
  }

  /** Convierte el nombre de un departamento a su ID. Útil al cargar datos guardados. */
  getMunicipiosPorNombreDep(nombreDep: string): Observable<MunicipioOut[]> {
    return this.getDepartamentos().pipe(
      switchMap(deps => {
        const dep = deps.find(d => d.nombre === nombreDep);
        return dep
          ? this.getMunicipios(dep.id)
          : new Observable<MunicipioOut[]>(obs => { obs.next([]); obs.complete(); });
      })
    );
  }
}
