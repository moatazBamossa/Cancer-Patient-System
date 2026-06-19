export const userProfileQueryKeys = {
  all: ['user_profiles'] as const,

  list: () => [...userProfileQueryKeys.all, 'list'] as const,

  detail: (id: string) => [...userProfileQueryKeys.all, 'detail', id] as const,

  byRole: (roleId: number) => [...userProfileQueryKeys.all, 'role', roleId] as const,
};
