import type { User, Role, LoginCredentials, AuthSession } from '../types';
import { getDataStore, simulateApiCall } from './mockApi';

export const authService = {
  async login({ username, password }: LoginCredentials): Promise<AuthSession> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const user = store.users.find(
        (u) => u.user_name === username && u.password === password && u.is_active
      );
      if (!user) throw new Error('Invalid credentials');
      const role = store.roles.find((r) => r.role_id === user.role_id);
      if (!role) throw new Error('Role not found');
      return { user, role, isAuthenticated: true };
    });
  },

  async validateSession(userId: string): Promise<AuthSession> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const user = store.users.find((u) => u.id === userId && u.is_active);
      if (!user) throw new Error('Session invalid');
      const role = store.roles.find((r) => r.role_id === user.role_id);
      if (!role) throw new Error('Role not found');
      return { user, role, isAuthenticated: true };
    });
  },
};
