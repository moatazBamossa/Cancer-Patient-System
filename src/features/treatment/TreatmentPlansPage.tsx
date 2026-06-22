import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
	Plus,
	ChevronRight,
	Layers,
	RefreshCw,
	Pill,
	Edit2,
	Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useTreatmentPlan } from '../../hooks/useTreatmentPlan';
import { diagnosisService } from '../../services/diagnosis.service';
import { doctorService } from '../../services/doctor.service';
import { treatmentService } from '../../services/treatment.service';
import { Modal } from '../../components/ui/Modal';
import { AppForm } from '../../components/ui/AppForm';
import { FormField } from '../../components/ui/FormField';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CardSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { zodValidator } from '../../lib/zodValidator';
import { formatDate } from '../../lib/utils';
import {
	treatmentPlanSchema,
	treatmentCycleSchema,
	cycleMedicationSchema,
	type TreatmentPlanFormValues,
	type TreatmentCycleFormValues,
	type CycleMedicationFormValues,
} from '../../schemas/treatmentPlan';
import type {
	TreatmentPlanRpcItem,
	TreatmentCycleRpcItem,
	CycleMedicationRpcItem,
} from '../../types/treatmentRpc';
import { CycleStatusBadge, PlanStatusBadge } from './treatmentBadges';

type ModalType = 'plan' | 'cycle' | 'medication' | null;
type DeleteTarget =
	| { type: 'plan'; item: TreatmentPlanRpcItem }
	| { type: 'cycle'; item: TreatmentCycleRpcItem }
	| { type: 'medication'; item: CycleMedicationRpcItem }
	| null;

export default function TreatmentPlansPage() {
	const { t } = useTranslation();

	const {
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
		useCyclesByPlan,
		useMedsByCycle,
	} = useTreatmentPlan();

	const [diagnosisId, setDiagnosisId] = useState<number | null>(null);
	const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
	const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

	const [modalType, setModalType] = useState<ModalType>(null);
	const [editPlan, setEditPlan] = useState<TreatmentPlanRpcItem | null>(null);
	const [editCycle, setEditCycle] = useState<TreatmentCycleRpcItem | null>(
		null,
	);
	const [editMed, setEditMed] = useState<CycleMedicationRpcItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
	const [formKey, setFormKey] = useState(0);

	const { data: diagnosesData, isLoading: diagnosesLoading } = useQuery({
		queryKey: ['diagnoses-list'],
		queryFn: () => diagnosisService.getAll({ page: 1, pageSize: 200 }),
	});

	const { data: doctors = [] } = useQuery({
		queryKey: ['doctors'],
		queryFn: () => doctorService.getAll(),
	});

	const { data: medications = [] } = useQuery({
		queryKey: ['medications'],
		queryFn: () => treatmentService.getMedications(),
	});

	const diagnoses = diagnosesData?.data ?? [];

	const {
		data: plansData,
		isLoading: plansLoading,
		isError: plansError,
		error: plansErr,
	} = usePlansByDiagnosis(diagnosisId);

	const { data: cyclesData, isLoading: cyclesLoading } =
		useCyclesByPlan(selectedPlanId);
	const { data: medsData, isLoading: medsLoading } =
		useMedsByCycle(selectedCycleId);

	const plans = plansData?.plans ?? [];
	const cycles = cyclesData?.cycles ?? [];
	const cycleMedications = medsData?.cycle_medications ?? [];

	const selectedPlan = plans.find((p) => p.plan_id === selectedPlanId) ?? null;
	const selectedDiagnosis = diagnoses.find(
		(d) => Number(d.diagnosis_id) === diagnosisId,
	);

	const openPlanModal = (plan?: TreatmentPlanRpcItem) => {
		setEditPlan(plan ?? null);
		setFormKey((k) => k + 1);
		setModalType('plan');
	};

	const openCycleModal = (cycle?: TreatmentCycleRpcItem) => {
		setEditCycle(cycle ?? null);
		setFormKey((k) => k + 1);
		setModalType('cycle');
	};

	const openMedModal = (med?: CycleMedicationRpcItem) => {
		setEditMed(med ?? null);
		setFormKey((k) => k + 1);
		setModalType('medication');
	};

	const closeModal = () => {
		setModalType(null);
		setEditPlan(null);
		setEditCycle(null);
		setEditMed(null);
	};

	const handlePlanSubmit = (values: TreatmentPlanFormValues) => {
		const payload = {
			p_diagnosis_id: values.diagnosis_id,
			p_treating_doctor_id: values.treating_doctor_id,
			p_plan_type: values.plan_type,
			p_protocol_name: values.protocol_name,
			p_treatment_goal: values.treatment_goal,
			p_priority: values.priority,
			p_start_date: values.start_date,
			p_expected_end_date: values.expected_end_date || undefined,
			p_total_cycles: values.total_cycles,
			p_status: values.status,
			p_response_status: values.response_status || undefined,
			p_notes: values.notes || undefined,
		};

		if (editPlan) {
			updatePlan.mutate(
				{ ...payload, p_plan_id: editPlan.plan_id },
				{
					onSuccess: () => {
						toast.success(t('treatment.planUpdated'));
						closeModal();
					},
					onError: (err: Error) => toast.error(err.message),
				},
			);
		} else {
			createPlan.mutate(payload, {
				onSuccess: () => {
					toast.success(t('treatment.planCreated'));
					closeModal();
				},
				onError: (err: Error) => toast.error(err.message),
			});
		}
	};

	const handleCycleSubmit = (values: TreatmentCycleFormValues) => {
		const payload = {
			p_plan_id: values.plan_id,
			p_cycle_number: values.cycle_number,
			p_cycle_date: values.cycle_date,
			p_status: values.status,
			p_side_effects: values.side_effects || '',
			p_progress_notes: values.progress_notes || '',
			p_administered_by:
				values.administered_by != null && values.administered_by !== ''
					? Number(values.administered_by)
					: undefined,
		};

		if (editCycle) {
			updateCycle.mutate(
				{ ...payload, p_cycle_id: editCycle.cycle_id },
				{
					onSuccess: () => {
						toast.success(t('treatment.cycleUpdated'));
						closeModal();
					},
					onError: (err: Error) => toast.error(err.message),
				},
			);
		} else {
			createCycle.mutate(payload, {
				onSuccess: () => {
					toast.success(t('treatment.cycleCreated'));
					closeModal();
				},
				onError: (err: Error) => toast.error(err.message),
			});
		}
	};

	const handleMedSubmit = (values: CycleMedicationFormValues) => {
		const payload = {
			p_cycle_id: values.cycle_id,
			p_medication_id: values.medication_id,
			p_dose: values.dose,
			p_dose_unit: values.dose_unit,
			p_route: values.route,
			p_frequency: values.frequency,
			p_note: values.note || undefined,
		};

		if (editMed) {
			updateCycleMedication.mutate(
				{ ...payload, p_id: editMed.id },
				{
					onSuccess: () => {
						toast.success(t('treatment.medUpdated'));
						closeModal();
					},
					onError: (err: Error) => toast.error(err.message),
				},
			);
		} else {
			createCycleMedication.mutate(payload, {
				onSuccess: () => {
					toast.success(t('treatment.medAdded'));
					closeModal();
				},
				onError: (err: Error) => toast.error(err.message),
			});
		}
	};

	const confirmDelete = () => {
		if (!deleteTarget || diagnosisId == null) return;

		if (deleteTarget.type === 'plan') {
			deletePlan.mutate(
				{ planId: deleteTarget.item.plan_id, diagnosisId },
				{
					onSuccess: () => {
						toast.success(t('treatment.planDeleted'));
						if (selectedPlanId === deleteTarget.item.plan_id) {
							setSelectedPlanId(null);
							setSelectedCycleId(null);
						}
						setDeleteTarget(null);
					},
					onError: (err: Error) => toast.error(err.message),
				},
			);
		} else if (deleteTarget.type === 'cycle' && selectedPlanId) {
			deleteCycle.mutate(
				{ cycleId: deleteTarget.item.cycle_id, planId: selectedPlanId },
				{
					onSuccess: () => {
						toast.success(t('treatment.cycleDeleted'));
						if (selectedCycleId === deleteTarget.item.cycle_id)
							setSelectedCycleId(null);
						setDeleteTarget(null);
					},
					onError: (err: Error) => toast.error(err.message),
				},
			);
		} else if (deleteTarget.type === 'medication' && selectedCycleId) {
			deleteCycleMedication.mutate(
				{ id: deleteTarget.item.id, cycleId: selectedCycleId },
				{
					onSuccess: () => {
						toast.success(t('treatment.medDeleted'));
						setDeleteTarget(null);
					},
					onError: (err: Error) => toast.error(err.message),
				},
			);
		}
	};

	const planInitialValues: TreatmentPlanFormValues = editPlan
		? {
				diagnosis_id: editPlan.diagnosis_id,
				treating_doctor_id: editPlan.treating_doctor_id,
				plan_type: editPlan.plan_type,
				protocol_name: editPlan.protocol_name,
				treatment_goal: editPlan.treatment_goal,
				priority:
					(editPlan.priority as TreatmentPlanFormValues['priority']) ||
					'medium',
				start_date: editPlan.start_date.split('T')[0],
				expected_end_date: editPlan.expected_end_date?.split('T')[0] ?? '',
				total_cycles: editPlan.total_cycles,
				status:
					(editPlan.status as TreatmentPlanFormValues['status']) || 'active',
				response_status:
					(editPlan.response_status as TreatmentPlanFormValues['response_status']) ??
					'',
				notes: editPlan.notes ?? '',
			}
		: {
				diagnosis_id: diagnosisId ?? 0,
				treating_doctor_id: 0,
				plan_type: 'Chemotherapy',
				protocol_name: '',
				treatment_goal: 'Curative',
				priority: 'medium',
				start_date: '',
				expected_end_date: '',
				total_cycles: 1,
				status: 'active',
				response_status: '',
				notes: '',
			};

	const cycleInitialValues: TreatmentCycleFormValues = editCycle
		? {
				plan_id: editCycle.plan_id,
				cycle_number: editCycle.cycle_number,
				cycle_date: editCycle.cycle_date.split('T')[0],
				status: editCycle.status as TreatmentCycleFormValues['status'],
				side_effects: editCycle.side_effects ?? '',
				progress_notes: editCycle.progress_notes ?? '',
				administered_by: editCycle.administered_by ?? '',
			}
		: {
				plan_id: selectedPlanId ?? 0,
				cycle_number: cycles.length + 1,
				cycle_date: '',
				status: 'scheduled',
				side_effects: '',
				progress_notes: '',
				administered_by: '',
			};

	const medInitialValues: CycleMedicationFormValues = editMed
		? {
				cycle_id: editMed.cycle_id,
				medication_id: editMed.medication_id,
				dose: editMed.dose,
				dose_unit: editMed.dose_unit,
				route: editMed.route,
				frequency: editMed.frequency,
				note: editMed.note ?? '',
			}
		: {
				cycle_id: selectedCycleId ?? 0,
				medication_id: 0,
				dose: 1,
				dose_unit: 'mg',
				route: 'IV',
				frequency: 'Once',
				note: '',
			};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="space-y-6">
			{/* Header */}
			<div>
				<h1
					className="text-2xl font-bold"
					style={{ color: 'var(--text-primary)' }}>
					{t('treatment.title')}
				</h1>
				<p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
					{t('treatment.subtitle')}
				</p>
			</div>

			{/* Breadcrumbs */}
			<nav
				className="flex flex-wrap items-center gap-1 text-xs"
				style={{ color: 'var(--text-muted)' }}>
				<span>{t('common.patients')}</span>
				<ChevronRight size={12} />
				<span>{t('common.diagnoses')}</span>
				{selectedDiagnosis && (
					<>
						<ChevronRight size={12} />
						<span className="text-indigo-500 font-medium">
							{selectedDiagnosis.patient_name ||
								`#${selectedDiagnosis.diagnosis_id}`}
						</span>
					</>
				)}
				{selectedPlan && (
					<>
						<ChevronRight size={12} />
						<span className="text-indigo-500 font-medium">
							{selectedPlan.protocol_name}
						</span>
					</>
				)}
				{selectedCycleId && (
					<>
						<ChevronRight size={12} />
						<span className="text-indigo-500 font-medium">
							{t('treatment.cycles')}
						</span>
					</>
				)}
				{selectedCycleId && (
					<>
						<ChevronRight size={12} />
						<span className="text-indigo-500 font-medium">
							{t('medications.title')}
						</span>
					</>
				)}
			</nav>

			{/* Diagnosis selector */}
			<div className="glass-card p-4">
				<label
					className="block text-sm font-medium mb-2"
					style={{ color: 'var(--text-secondary)' }}>
					{t('treatment.selectDiagnosis')}
				</label>
				<select
					value={diagnosisId ?? ''}
					onChange={(e) => {
						const id = e.target.value ? Number(e.target.value) : null;
						setDiagnosisId(id);
						setSelectedPlanId(null);
						setSelectedCycleId(null);
					}}
					disabled={diagnosesLoading}
					className="input-field w-full max-w-md">
					<option value="">{t('treatment.chooseDiagnosis')}</option>
					{diagnoses.map((d) => (
						<option key={d.diagnosis_id} value={d.diagnosis_id}>
							{d.patient_name || t('common.patient')} — {d.cancer_name}
						</option>
					))}
				</select>
			</div>

			{/* Plans section */}
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2
						className="text-lg font-semibold flex items-center gap-2"
						style={{ color: 'var(--text-primary)' }}>
						<Layers size={18} className="text-blue-500" />
						{t('treatment.title')}
						{plans.length > 0 && (
							<span
								className="text-xs font-normal"
								style={{ color: 'var(--text-muted)' }}>
								({plans.length})
							</span>
						)}
					</h2>
					{diagnosisId && (
						<button
							type="button"
							onClick={() => openPlanModal()}
							className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
							<Plus size={16} /> {t('treatment.addPlan')}
						</button>
					)}
				</div>

				{!diagnosisId && (
					<div
						className="glass-card p-8 text-center"
						style={{ color: 'var(--text-muted)' }}>
						{t('treatment.chooseDiagnosisFirst')}
					</div>
				)}

				{plansError && (
					<div className="glass-card p-4 border border-red-500/30 bg-red-500/5 text-sm text-red-500">
						{(plansErr as Error)?.message || t('common.error')}
					</div>
				)}

				{diagnosisId && plansLoading && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<CardSkeleton key={i} />
						))}
					</div>
				)}

				{diagnosisId && !plansLoading && plans.length === 0 && (
					<div
						className="glass-card p-8 text-center"
						style={{ color: 'var(--text-muted)' }}>
						{t('treatment.noTreatmentPlans')}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{plans.map((plan) => (
						<div
							key={plan.plan_id}
							className={`glass-card p-5 border-l-4 transition-all ${
								selectedPlanId === plan.plan_id
									? 'border-blue-500 ring-2 ring-blue-500/20'
									: 'border-transparent'
							}`}>
							<div className="flex justify-between items-start mb-2">
								<h3
									className="font-semibold text-lg"
									style={{ color: 'var(--text-primary)' }}>
									{plan.protocol_name}
								</h3>
								<PlanStatusBadge status={plan.status} />
							</div>
							<p
								className="text-sm mb-3"
								style={{ color: 'var(--text-muted)' }}>
								{plan.plan_type}
							</p>
							<div
								className="space-y-1 text-sm"
								style={{ color: 'var(--text-secondary)' }}>
								<p>
									{t('diagnoses.doctor')}:{' '}
									{plan.doctor_name || `#${plan.treating_doctor_id}`}
								</p>
								<p>
									{t('treatment.start')}: {formatDate(plan.start_date)}
								</p>
								<p>
									{t('treatment.goal')}: {plan.treatment_goal}
								</p>
								<p>
									{t('treatment.priority')}: {plan.priority}
								</p>
								<p>
									{t('treatment.totalCycles')}: {plan.total_cycles}
								</p>
							</div>
							<div className="mt-4 flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => {
										setSelectedPlanId(plan.plan_id);
										setSelectedCycleId(null);
									}}
									className="gradient-btn px-3 py-1.5 text-xs">
									{t('treatment.viewCycles')}
								</button>
								<button
									type="button"
									onClick={() => openPlanModal(plan)}
									className="p-1.5 rounded-lg hover:bg-amber-500/10"
									style={{ color: 'var(--text-muted)' }}>
									<Edit2 size={14} />
								</button>
								<button
									type="button"
									onClick={() => setDeleteTarget({ type: 'plan', item: plan })}
									className="p-1.5 rounded-lg hover:bg-red-500/10"
									style={{ color: 'var(--text-muted)' }}>
									<Trash2 size={14} />
								</button>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Cycles section */}
			{selectedPlanId && (
				<section
					className="space-y-4 border-t pt-6"
					style={{ borderColor: 'var(--border-color)' }}>
					<div className="flex items-center justify-between">
						<h2
							className="text-lg font-semibold flex items-center gap-2"
							style={{ color: 'var(--text-primary)' }}>
							<RefreshCw size={18} className="text-blue-500" />
							{t('treatment.cycles')}
						</h2>
						<button
							type="button"
							onClick={() => openCycleModal()}
							className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
							<Plus size={16} /> {t('treatment.addCycle')}
						</button>
					</div>

					{cyclesLoading && <TableSkeleton rows={3} cols={4} />}

					{!cyclesLoading && cycles.length === 0 && (
						<div
							className="glass-card p-6 text-center text-sm"
							style={{ color: 'var(--text-muted)' }}>
							{t('treatment.noCycles')}
						</div>
					)}

					<div className="space-y-3">
						{cycles.map((cycle) => (
							<div
								key={cycle.cycle_id}
								className={`glass-card p-4 ${
									selectedCycleId === cycle.cycle_id
										? 'ring-2 ring-blue-500/20'
										: ''
								}`}>
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div>
										<div className="flex items-center gap-2">
											<span
												className="font-bold"
												style={{ color: 'var(--text-primary)' }}>
												{t('treatment.cycle')} {cycle.cycle_number}
											</span>
											<CycleStatusBadge status={cycle.status} />
										</div>
										<p
											className="text-sm mt-1"
											style={{ color: 'var(--text-muted)' }}>
											{t('common.date')}: {formatDate(cycle.cycle_date)}
										</p>
										{cycle.administered_by_name && (
											<p
												className="text-sm"
												style={{ color: 'var(--text-muted)' }}>
												{t('diagnoses.doctor')}: {cycle.administered_by_name}
											</p>
										)}
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => setSelectedCycleId(cycle.cycle_id)}
											className="gradient-btn px-3 py-1.5 text-xs">
											{t('treatment.viewMedications')}
										</button>
										<button
											type="button"
											onClick={() => openCycleModal(cycle)}
											className="p-1.5 rounded-lg hover:bg-amber-500/10">
											<Edit2 size={14} />
										</button>
										<button
											type="button"
											onClick={() =>
												setDeleteTarget({ type: 'cycle', item: cycle })
											}
											className="p-1.5 rounded-lg hover:bg-red-500/10">
											<Trash2 size={14} />
										</button>
									</div>
								</div>
								{cycle.side_effects && (
									<p className="text-sm text-red-500 mt-2">
										{t('treatment.sideEffects')}: {cycle.side_effects}
									</p>
								)}
								{cycle.progress_notes && (
									<p
										className="text-sm mt-1"
										style={{ color: 'var(--text-muted)' }}>
										{t('common.notes')}: {cycle.progress_notes}
									</p>
								)}
							</div>
						))}
					</div>
				</section>
			)}

			{/* Medications section */}
			{selectedCycleId && (
				<section
					className="space-y-4 border-t pt-6"
					style={{ borderColor: 'var(--border-color)' }}>
					<div className="flex items-center justify-between">
						<h2
							className="text-lg font-semibold flex items-center gap-2"
							style={{ color: 'var(--text-primary)' }}>
							<Pill size={18} className="text-blue-500" />
							{t('medications.title')}
						</h2>
						<button
							type="button"
							onClick={() => openMedModal()}
							className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
							<Plus size={16} /> {t('treatment.addMedication')}
						</button>
					</div>

					{medsLoading && <TableSkeleton rows={4} cols={7} />}

					{!medsLoading && cycleMedications.length === 0 && (
						<div
							className="glass-card p-6 text-center text-sm"
							style={{ color: 'var(--text-muted)' }}>
							{t('treatment.noMedications')}
						</div>
					)}

					{!medsLoading && cycleMedications.length > 0 && (
						<div className="table-container overflow-x-auto">
							<table className="data-table w-full">
								<thead>
									<tr>
										<th>{t('medications.title')}</th>
										<th>{t('medications.category')}</th>
										<th>{t('treatment.dose')}</th>
										<th>{t('treatment.route')}</th>
										<th>{t('treatment.frequency')}</th>
										<th>{t('common.notes')}</th>
										<th>{t('common.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{cycleMedications.map((med) => (
										<tr key={med.id}>
											<td className="font-medium">
												{med.medication_name || `#${med.medication_id}`}
											</td>
											<td>{med.medication_category || '—'}</td>
											<td>
												{med.dose} {med.dose_unit}
											</td>
											<td>{med.route}</td>
											<td>{med.frequency}</td>
											<td>{med.note || '—'}</td>
											<td>
												<div className="flex gap-1">
													<button
														type="button"
														onClick={() => openMedModal(med)}
														className="p-1 hover:bg-amber-500/10 rounded">
														<Edit2 size={14} />
													</button>
													<button
														type="button"
														onClick={() =>
															setDeleteTarget({ type: 'medication', item: med })
														}
														className="p-1 hover:bg-red-500/10 rounded">
														<Trash2 size={14} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			)}

			{/* Plan modal */}
			<Modal
				isOpen={modalType === 'plan'}
				onClose={closeModal}
				title={
					editPlan ? t('treatment.editPlanTitle') : t('treatment.addPlanTitle')
				}
				size="lg">
				<AppForm<TreatmentPlanFormValues>
					formKey={formKey}
					initialValues={planInitialValues}
					validate={zodValidator(treatmentPlanSchema)}
					onSubmit={handlePlanSubmit}
					className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<FormField
							name="protocol_name"
							label={t('common.title')}
							required
						/>
						<FormField
							name="diagnosis_id"
							label={t('treatment.diagnosis')}
							type="select"
							required
							disabled
							options={diagnoses.map((d) => ({
								value: String(d.diagnosis_id),
								label: `#${d.patient_name} — ${d.cancer_name}`,
							}))}
						/>
						<FormField
							name="treating_doctor_id"
							label={t('diagnoses.doctor')}
							type="select"
							required
							options={doctors.map((d) => ({
								value: String(d.doctor_id),
								label: d.full_name,
							}))}
						/>
						<FormField
							name="plan_type"
							label={t('treatment.planType')}
							type="select"
							required
							options={[
								{ value: 'Chemotherapy', label: 'Chemotherapy' },
								{ value: 'Radiation', label: 'Radiation' },
								{ value: 'Surgery', label: 'Surgery' },
								{ value: 'Palliative', label: 'Palliative' },
							]}
						/>
						<FormField
							name="treatment_goal"
							label={t('treatment.goal')}
							type="select"
							required
							options={[
								{ value: 'Curative', label: 'Curative' },
								{ value: 'Palliative', label: 'Palliative' },
								{ value: 'Preventive', label: 'Preventive' },
							]}
						/>
						<FormField
							name="priority"
							label={t('treatment.priority')}
							type="select"
							required
							options={[
								{ value: 'low', label: 'Low' },
								{ value: 'medium', label: 'Medium' },
								{ value: 'high', label: 'High' },
								{ value: 'urgent', label: 'Urgent' },
							]}
						/>
						<FormField
							name="total_cycles"
							label={t('treatment.totalCycles')}
							type="number"
							required
						/>
						<FormField
							name="start_date"
							label={t('treatment.startDate')}
							type="date"
							required
						/>
						<FormField
							name="expected_end_date"
							label={t('treatment.expectedEndDate')}
							type="date"
						/>
						<FormField
							name="status"
							label={t('common.status.label')}
							type="select"
							required
							options={[
								{ value: 'draft', label: 'Draft' },
								{ value: 'active', label: 'Active' },
								{ value: 'completed', label: 'Completed' },
								{ value: 'cancelled', label: 'Cancelled' },
							]}
						/>
						<FormField
							name="response_status"
							label={t('treatment.responseStatus')}
							type="select"
							options={[
								{ value: '', label: '—' },
								{ value: 'complete_response', label: 'Complete Response' },
								{ value: 'partial_response', label: 'Partial Response' },
								{ value: 'stable_disease', label: 'Stable Disease' },
								{ value: 'progressive_disease', label: 'Progressive Disease' },
							]}
						/>
					</div>
					<FormField name="notes" label={t('common.notes')} type="textarea" />
					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={createPlan.isPending || updatePlan.isPending}
							className="gradient-btn px-6 py-2.5 text-sm disabled:opacity-60">
							{editPlan ? t('common.save') : t('treatment.createPlan')}
						</button>
					</div>
				</AppForm>
			</Modal>

			{/* Cycle modal */}
			<Modal
				isOpen={modalType === 'cycle'}
				onClose={closeModal}
				title={
					editCycle
						? t('treatment.editCycleTitle')
						: t('treatment.addCycleTitle')
				}
				size="md">
				<AppForm<TreatmentCycleFormValues>
					formKey={formKey}
					initialValues={cycleInitialValues}
					validate={zodValidator(treatmentCycleSchema)}
					onSubmit={handleCycleSubmit}
					className="space-y-4">
					<FormField
						name="cycle_number"
						label={t('treatment.cycleNumber')}
						type="number"
						required
					/>
					<FormField
						name="cycle_date"
						label={t('common.date')}
						type="date"
						required
					/>
					<FormField
						name="status"
						label={t('common.status.label')}
						type="select"
						required
						options={[
							{ value: 'scheduled', label: 'Scheduled' },
							{ value: 'completed', label: 'Completed' },
							{ value: 'skipped', label: 'Skipped' },
							{ value: 'delayed', label: 'Delayed' },
						]}
					/>
					<FormField
						name="administered_by"
						label={t('diagnoses.doctor')}
						type="select"
						options={[
							{ value: '', label: '—' },
							...doctors.map((d) => ({
								value: String(d.doctor_id),
								label: d.full_name,
							})),
						]}
					/>
					<FormField
						name="side_effects"
						label={t('treatment.sideEffects')}
						type="textarea"
					/>
					<FormField
						name="progress_notes"
						label={t('common.notes')}
						type="textarea"
					/>
					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={createCycle.isPending || updateCycle.isPending}
							className="gradient-btn px-6 py-2.5 text-sm disabled:opacity-60">
							{editCycle ? t('common.save') : t('treatment.createCycle')}
						</button>
					</div>
				</AppForm>
			</Modal>

			{/* Medication modal */}
			<Modal
				isOpen={modalType === 'medication'}
				onClose={closeModal}
				title={
					editMed ? t('treatment.editMedTitle') : t('treatment.addMedTitle')
				}
				size="md">
				<AppForm<CycleMedicationFormValues>
					formKey={formKey}
					initialValues={medInitialValues}
					validate={zodValidator(cycleMedicationSchema)}
					onSubmit={handleMedSubmit}
					className="space-y-4">
					{/* <FormField
            name="medication_id"
            label={t('medications.title')}
            type="select"
            required

            options={medications.map((m) => ({
              value: String(m.medication_id),
              label: m.name,
            }))}
          /> */}
					<div className="grid grid-cols-2 gap-4">
						<FormField
							name="dose"
							label={t('treatment.dose')}
							type="number"
							required
						/>
						<FormField
							name="dose_unit"
							label={t('treatment.doseUnit')}
							required
						/>
					</div>
					<FormField
						name="route"
						label={t('treatment.route')}
						required
						placeholder={t('treatment.routePlaceholder')}
					/>
					<FormField
						name="frequency"
						label={t('treatment.frequency')}
						required
						placeholder={t('treatment.frequencyPlaceholder')}
					/>
					<FormField name="note" label={t('common.notes')} type="textarea" />
					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={
								createCycleMedication.isPending ||
								updateCycleMedication.isPending
							}
							className="gradient-btn px-6 py-2.5 text-sm disabled:opacity-60">
							{editMed ? t('common.save') : t('treatment.addMedication')}
						</button>
					</div>
				</AppForm>
			</Modal>

			<ConfirmDialog
				isOpen={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={confirmDelete}
				title={t('common.delete')}
				message={t('common.confirm')}
				confirmText={t('common.delete')}
				cancelText={t('common.cancel')}
			/>
		</motion.div>
	);
}
