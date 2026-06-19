export const roleQueryKeys = {
  all: ['roles'] as const,

  list: () => [...roleQueryKeys.all, 'list'] as const,

  detail: (roleId: number) => [...roleQueryKeys.all, 'detail', roleId] as const,

  byName: (roleName: string) => [...roleQueryKeys.all, 'name', roleName] as const,

  paginated: (limit: number, offset: number) => [...roleQueryKeys.all, 'paginated', limit, offset] as const,
};
