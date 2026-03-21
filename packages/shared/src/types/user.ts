import { Role } from '../constants/roles';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  schoolId: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
}
