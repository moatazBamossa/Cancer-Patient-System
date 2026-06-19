import { supabase } from '../lib/supabaseClient';

export async function rpcCall<T = any>(fnName: string, params: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fnName, params);

  if (error) {
    console.error(`RPC Error [${fnName}]:`, error.message);
    throw new Error(error.message);
  }
  // For RPCs that return { success, data, error }
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      console.error(`RPC Logic Error [${fnName}]:`, data.error || data.message);
      throw new Error(data.error || data.message || 'Operation failed');
    }
    // If the backend returns { success: true, data: ... }
    if ('data' in data && data.data !== undefined) {
      return data.data as T;
    }
    // If the backend returns { success: true, user: ..., ... } (flat structure)
    return data as T;
  }

  // For RPCs that return table rows (arrays)
  return data as T;
}
