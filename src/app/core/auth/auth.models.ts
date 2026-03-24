export interface LoginRequest {
  email: string;
  password: string;
}

export interface UsuarioToken {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: UsuarioToken;
}
