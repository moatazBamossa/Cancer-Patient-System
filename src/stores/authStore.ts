import { create } from 'zustand';
import type { User, Role } from '../types';

interface AuthState {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (user: User, role: Role) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,

  login: (user: User, role: Role) =>
    set({ user, role, isAuthenticated: true }),

  logout: () =>
    set({ user: null, role: null, isAuthenticated: false }),

  updateUser: (user: User) =>
    set({ user }),
}));
