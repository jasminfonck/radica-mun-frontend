import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, TokenResponse, UsuarioToken } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY      = 'radica_token';
  private readonly USER_KEY       = 'radica_usuario';
  private readonly DESPLAZADO_KEY = 'radica_sesion_desplazada';

  private usuarioSubject = new BehaviorSubject<UsuarioToken | null>(this.getUsuarioStorage());
  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(data: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>('/api/auth/login', data).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.access_token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.usuario));
        this.usuarioSubject.next(res.usuario);
      })
    );
  }

  logout(desplazado = false): void {
    if (desplazado) {
      localStorage.setItem(this.DESPLAZADO_KEY, '1');
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.usuarioSubject.next(null);
    this.router.navigate(['/login']);
  }

  consumirDesplazado(): boolean {
    const fue = localStorage.getItem(this.DESPLAZADO_KEY) === '1';
    localStorage.removeItem(this.DESPLAZADO_KEY);
    return fue;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsuario(): UsuarioToken | null {
    return this.usuarioSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  tieneRol(...roles: string[]): boolean {
    const usuario = this.getUsuario();
    return !!usuario && roles.includes(usuario.rol);
  }

  private getUsuarioStorage(): UsuarioToken | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
