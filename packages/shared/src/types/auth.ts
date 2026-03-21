import { Role } from '../constants/roles';

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  schoolId: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
