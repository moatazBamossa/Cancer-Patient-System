// ─── Medication RPC Types ─────────────────────────────────────────────────────

/** Row shape returned by list / search / get / create / update RPCs */
export interface MedicationRpcItem {
  medication_id: number;
  name:          string;
  category:      string;
  unit:          string | null;
  description:   string | null;
  is_active:     boolean;
}

/** Wrapper some RPCs return: { success, medications: [...] } */
export interface MedicationListPayload {
  success?:     boolean;
  message?:     string;
  medications?: MedicationRpcItem[];
}

/** Wrapper for single-item RPCs: { success, medication: {...} } */
export interface MedicationMutationPayload {
  success?:    boolean;
  message?:    string;
  medication?: MedicationRpcItem;
}

/** Wrapper for medication_list_categories */
export interface MedicationCategoriesPayload {
  success?:    boolean;
  message?:    string;
  categories?: string[];
}

// ─── Input types matching Supabase function signatures exactly ────────────────

/**
 * medication_create(
 *   p_name        text,
 *   p_category    text,
 *   p_unit        text,
 *   p_description text,
 *   p_is_active   boolean
 * )
 */
export interface MedicationCreateInput {
  p_name:         string;
  p_category:     string;
  p_unit?:        string;
  p_description?: string;
  p_is_active?:   boolean;
}

/**
 * medication_update(
 *   p_medication_id integer,
 *   p_name          text,
 *   p_category      text,
 *   p_unit          text,
 *   p_description   text,
 *   p_is_active     boolean
 * )
 */
export interface MedicationUpdateInput {
  p_medication_id: number;
  p_name:          string;
  p_category:      string;
  p_unit?:         string;
  p_description?:  string;
  p_is_active?:    boolean;
}

/**
 * medication_search_by_name(p_search text)
 */
export interface MedicationSearchInput {
  p_search: string;
}
