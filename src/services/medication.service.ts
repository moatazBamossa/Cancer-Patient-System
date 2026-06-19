import { rpcCall } from '../utils/rpcCall';
import type {
  MedicationRpcItem,
  MedicationListPayload,
  MedicationMutationPayload,
  MedicationCategoriesPayload,
  MedicationCreateInput,
  MedicationUpdateInput,
} from '../types/medicationRpc';

// ─── Helper: safely extract a medications array from any RPC response shape ───
function extractMedications(data: any): MedicationRpcItem[] {
  if (!data) return [];
  if (data.medications) return data.medications;   // { success, medications: [...] }
  if (Array.isArray(data)) return data;            // plain array
  return [];
}

// ─── Helper: safely extract categories from any RPC response shape ────────────
function extractCategories(data: any): string[] {
  if (!data) return [];
  if (data.categories) return data.categories;
  if (Array.isArray(data)) return data.map((r: any) => r.category ?? r);
  return [];
}

export const medicationService = {
  /** List all medications */
  async listAll(): Promise<MedicationRpcItem[]> {
    const data = await rpcCall<MedicationListPayload>('medication_list_all', {});
    return extractMedications(data);
  },

  /** Get a single medication by ID */
  async getById(id: number): Promise<MedicationRpcItem | null> {
    const data = await rpcCall<MedicationMutationPayload>('medication_get_by_id', {
      p_medication_id: id,
    });
    if (data?.medication) return data.medication;
    if (Array.isArray(data) && data.length > 0) return (data as any[])[0];
    return null;
  },

  /** List medications filtered by category */
  async listByCategory(category: string): Promise<MedicationRpcItem[]> {
    const data = await rpcCall<MedicationListPayload>('medication_list_by_category', {
      p_category: category,
    });
    return extractMedications(data);
  },

  /**
   * Search medications by name
   * RPC: medication_search_by_name(p_search text)
   */
  async searchByName(search: string): Promise<MedicationRpcItem[]> {
    const data = await rpcCall<MedicationListPayload>('medication_search_by_name', {
      p_search: search,
    });
    return extractMedications(data);
  },

  /** Get distinct category list */
  async listCategories(): Promise<string[]> {
    const data = await rpcCall<MedicationCategoriesPayload>('medication_list_categories', {});
    return extractCategories(data);
  },

  /**
   * Create a new medication
   * RPC: medication_create(p_name, p_category, p_unit, p_description, p_is_active)
   */
  async create(input: MedicationCreateInput): Promise<MedicationRpcItem> {
    const data = await rpcCall<MedicationMutationPayload>('medication_create', {
      p_name:        input.p_name,
      p_category:    input.p_category,
      p_unit:        input.p_unit        ?? null,
      p_description: input.p_description ?? null,
      p_is_active:   input.p_is_active   ?? true,
    });
    if (data?.medication) return data.medication;
    return data as unknown as MedicationRpcItem;
  },

  /**
   * Update an existing medication
   * RPC: medication_update(p_medication_id, p_name, p_category, p_unit, p_description, p_is_active)
   */
  async update(input: MedicationUpdateInput): Promise<MedicationRpcItem> {
    const data = await rpcCall<MedicationMutationPayload>('medication_update', {
      p_medication_id: input.p_medication_id,
      p_name:          input.p_name,
      p_category:      input.p_category,
      p_unit:          input.p_unit        ?? null,
      p_description:   input.p_description ?? null,
      p_is_active:     input.p_is_active   ?? true,
    });
    if (data?.medication) return data.medication;
    return data as unknown as MedicationRpcItem;
  },

  /** Delete a medication by ID */
  async delete(id: number): Promise<void> {
    await rpcCall<any>('medication_delete', { p_medication_id: id });
  },
};
