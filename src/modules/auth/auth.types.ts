export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface GoogleLoginDto {
  credential: string;
}

export interface AuthTokenPayload {
  id: number;
  email: string;
  role: string;
}

export interface AuthResult {
  payload: AuthTokenPayload;
  token: string;
}

export interface CurrentUserDto {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  role: string;
  roleId: number | null;
  roleName: string | null;
  permissions: string[];
}
