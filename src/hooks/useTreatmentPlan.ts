import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type {
  CycleMedicationCreateInput,
  CycleMedicationUpdateInput,
  CycleMedicationsListPayload,
  TreatmentCycleCreateInput,
  TreatmentCycleUpdateInput,
  TreatmentCyclesListPayload,
  TreatmentPlanCreateInput,
  TreatmentPlanUpdateInput,
  TreatmentPlansListPayload,
} from '../types/treatmentRpc';

async function callRpc<T>(fnName: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fnName, params);
  if (error) throw new Error(error.message);

  if (data && typeof data === 'object' && 'success' in data && !(data as { success: boolean }).success) {
    const payload = data as { message?: string; error?: string };
    throw new Error(payload.message || payload.error || 'Operation failed');
  }

  return data as T;
}

function unwrapListPayload<T>(data: unknown, rpcKey: string): T {
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>;
    if (first[rpcKey] !== undefined) {
      return first[rpcKey] as T;
    }
  }

  if (data && typeof data === 'object' && rpcKey in data) {
    return (data as Record<string, T>)[rpcKey];
  }

  return (data ?? {}) as T;
}

export function useTreatmentPlan() {
  const queryClient = useQueryClient();

  const invalidatePlans = () =>
    queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });

  const invalidateCycles = () =>
    queryClient.invalidateQueries({ queryKey: ['treatment-cycles'] });

  const invalidateMeds = () =>
    queryClient.invalidateQueries({ queryKey: ['cycle-medications'] });

  const createPlan = useMutation({
    mutationFn: (data: TreatmentPlanCreateInput) =>
      callRpc('treatment_plan_create', data as unknown as Record<string, unknown>),
    onSuccess: invalidatePlans,
  });

  const updatePlan = useMutation({
    mutationFn: (data: TreatmentPlanUpdateInput) =>
      callRpc('treatment_plan_update', data as unknown as Record<string, unknown>),
    onSuccess: invalidatePlans,
  });

  const deletePlan = useMutation({
    mutationFn: ({ planId }: { planId: number; diagnosisId: number }) =>
      callRpc('treatment_plan_delete', { p_plan_id: planId }),
    onMutate: async ({ planId, diagnosisId }) => {
      const queryKey = ['treatment-plans', diagnosisId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TreatmentPlansListPayload>(queryKey);
      if (previous?.plans) {
        queryClient.setQueryData<TreatmentPlansListPayload>(queryKey, {
          ...previous,
          plans: previous.plans.filter((p) => p.plan_id !== planId),
        });
      }
      return { previous, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: invalidatePlans,
  });

  const createCycle = useMutation({
    mutationFn: (data: TreatmentCycleCreateInput) =>
      callRpc('treatment_cycle_create', data as unknown as Record<string, unknown>),
    onSuccess: invalidateCycles,
  });

  const updateCycle = useMutation({
    mutationFn: (data: TreatmentCycleUpdateInput) =>
      callRpc('treatment_cycle_update', data as unknown as Record<string, unknown>),
    onSuccess: invalidateCycles,
  });

  const deleteCycle = useMutation({
    mutationFn: ({ cycleId }: { cycleId: number; planId: number }) =>
      callRpc('treatment_cycle_delete', { p_cycle_id: cycleId }),
    onMutate: async ({ cycleId, planId }) => {
      const queryKey = ['treatment-cycles', planId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TreatmentCyclesListPayload>(queryKey);
      if (previous?.cycles) {
        queryClient.setQueryData<TreatmentCyclesListPayload>(queryKey, {
          ...previous,
          cycles: previous.cycles.filter((c) => c.cycle_id !== cycleId),
        });
      }
      return { previous, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: invalidateCycles,
  });

  const createCycleMedication = useMutation({
    mutationFn: (data: CycleMedicationCreateInput) =>
      callRpc('cycle_medication_create', data as unknown as Record<string, unknown>),
    onSuccess: invalidateMeds,
  });

  const updateCycleMedication = useMutation({
    mutationFn: (data: CycleMedicationUpdateInput) =>
      callRpc('cycle_medication_update', data as unknown as Record<string, unknown>),
    onSuccess: invalidateMeds,
  });

  const deleteCycleMedication = useMutation({
    mutationFn: ({ id }: { id: number; cycleId: number }) =>
      callRpc('cycle_medication_delete', { p_id: id }),
    onMutate: async ({ id, cycleId }) => {
      const queryKey = ['cycle-medications', cycleId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CycleMedicationsListPayload>(queryKey);
      if (previous?.cycle_medications) {
        queryClient.setQueryData<CycleMedicationsListPayload>(queryKey, {
          ...previous,
          cycle_medications: previous.cycle_medications.filter((m) => m.id !== id),
        });
      }
      return { previous, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: invalidateMeds,
  });

  const usePlansByDiagnosis = (diagnosisId: number | null) =>
    useQuery({
      queryKey: ['treatment-plans', diagnosisId],
      enabled: diagnosisId != null && diagnosisId > 0,
      queryFn: async () => {
        const raw = await callRpc<unknown>('treatment_plan_list_by_diagnosis', {
          p_diagnosis_id: diagnosisId,
        });
        return unwrapListPayload<TreatmentPlansListPayload>(raw, 'treatment_plan_list_by_diagnosis');
      },
    });

  const usePlanById = (planId: number | null) =>
    useQuery({
      queryKey: ['treatment-plan', planId],
      enabled: planId != null && planId > 0,
      queryFn: () =>
        callRpc('treatment_plan_get_by_id', { p_plan_id: planId }),
    });

  const useCyclesByPlan = (planId: number | null) =>
    useQuery({
      queryKey: ['treatment-cycles', planId],
      enabled: planId != null && planId > 0,
      queryFn: async () => {
        const raw = await callRpc<unknown>('treatment_cycle_list_by_plan', {
          p_plan_id: planId,
        });
        return unwrapListPayload<TreatmentCyclesListPayload>(raw, 'treatment_cycle_list_by_plan');
      },
    });

  const useMedsByCycle = (cycleId: number | null) =>
    useQuery({
      queryKey: ['cycle-medications', cycleId],
      enabled: cycleId != null && cycleId > 0,
      queryFn: async () => {
        const raw = await callRpc<unknown>('cycle_medication_list_by_cycle', {
          p_cycle_id: cycleId,
        });
        return unwrapListPayload<CycleMedicationsListPayload>(
          raw,
          'cycle_medication_list_by_cycle'
        );
      },
    });

  return {
    createPlan,
    updatePlan,
    deletePlan,
    createCycle,
    updateCycle,
    deleteCycle,
    createCycleMedication,
    updateCycleMedication,
    deleteCycleMedication,
    usePlansByDiagnosis,
    usePlanById,
    useCyclesByPlan,
    useMedsByCycle,
  };
}
