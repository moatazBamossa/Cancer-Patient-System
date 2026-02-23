import type { User, LoginCredentials, Role } from '../types';
import { getDataStore, simulateApiCall } from './mockApi';

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; role: Role }> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const user = store.users.find(
        (u) => u.username === credentials.username && u.password === credentials.password
      );
      if (!user) throw new Error('Invalid username or password');
      if (!user.is_active) throw new Error('Account is deactivated');
      const role = store.roles.find((r) => r.id === user.role_id);
      if (!role) throw new Error('Role not found');

      // Log activity
      store.activity_logs.push({
        id: `al-${Date.now()}`,
        user_id: user.id,
        action: 'login',
        entity_type: 'auth',
        entity_id: null,
        description: `${user.full_name} logged in`,
        timestamp: new Date().toISOString(),
      });

      return { user, role };
    });
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      store.users[idx] = { ...store.users[idx], ...updates };
      return store.users[idx];
    });
  },
};
