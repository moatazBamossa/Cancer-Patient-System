import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Plus,
	Activity,
	Thermometer,
	Heart,
	Wind,
	Droplet,
	Scale,
	Calendar,
	User as UserIcon,
	FileText,
	ChevronDown,
	ChevronUp,
} from 'lucide-react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Field, useField } from 'react-final-form';
import { visitService } from '../../services/visit.service';
import { patientService } from '../../services/patient.service';
import { doctorService } from '../../services/doctor.service';
import { diagnosisService } from '../../services/diagnosis.service';
import { Modal } from '../../components/ui/Modal';
import { AppForm } from '../../components/ui/AppForm';
import { FormField } from '../../components/ui/FormField';
import { zodValidator } from '../../lib/zodValidator';
import { formatDate, formatTime } from '../../lib/utils';
import type {
	ClinicVisitRpcItem,
} from '../../types/visitRpc';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const combinedVisitSchema = z.object({
	p_patient_id: z.string().min(1, 'Patient is required'),
	p_doctor_id: z.string().min(1, 'Doctor is required'),
	p_diagnosis_id: z.string().optional(),
	p_visit_date: z.string().min(1, 'Visit date is required'),
	p_visit_type: z.enum(['Routine', 'Follow-up', 'Emergency', 'Post-treatment']).default('Routine'),
	p_reason_for_visit: z.string().min(1, 'Reason is required'),
	p_clinical_notes: z.string().optional(),
	p_recommendations: z.string().optional(),
	p_next_visit_date: z.string().optional(),

	include_vitals: z.boolean().default(false),
	p_temperature: z.coerce.number().optional().or(z.literal('')),
	p_blood_pressure_sys: z.coerce.number().optional().or(z.literal('')),
	p_blood_pressure_dia: z.coerce.number().optional().or(z.literal('')),
	p_heart_rate: z.coerce.number().optional().or(z.literal('')),
	p_respiratory_rate: z.coerce.number().optional().or(z.literal('')),
	p_spo2: z.coerce.number().optional().or(z.literal('')),
	p_weight_kg: z.coerce.number().optional().or(z.literal('')),
	p_height_cm: z.coerce.number().optional().or(z.literal('')),
	p_vital_notes: z.string().optional(),
});

type CombinedVisitForm = z.infer<typeof combinedVisitSchema>;

const DEFAULT_FORM_VALUES: CombinedVisitForm = {
	p_patient_id: '',
	p_doctor_id: '',
	p_diagnosis_id: '',
	p_visit_date: '',
	p_visit_type: 'Routine',
	p_reason_for_visit: '',
	p_clinical_notes: '',
	p_recommendations: '',
	p_next_visit_date: '',
	include_vitals: false,
	p_temperature: '',
	p_blood_pressure_sys: '',
	p_blood_pressure_dia: '',
	p_heart_rate: '',
	p_respiratory_rate: '',
	p_spo2: '',
	p_weight_kg: '',
	p_height_cm: '',
	p_vital_notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAbnormal(type: string, value: number, val2?: number): boolean {
	switch (type) {
		case 'temp':
			return value < 36.1 || value > 37.5;
		case 'sys':
			return value < 90 || value > 140;
		case 'dia':
			return value < 60 || value > 90;
		case 'hr':
			return value < 60 || value > 100;
		case 'rr':
			return value < 12 || value > 20;
		case 'spo2':
			return value < 95;
		default:
			return false;
	}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VitalCard({
	title,
	value,
	unit,
	icon,
	abnormal,
}: {
	title: string;
	value: string | number;
	unit: string;
	icon: React.ReactNode;
	abnormal: boolean;
}) {
	const { t } = useTranslation();
	return (
		<div
			className={`p-4 rounded-xl border transition-all ${abnormal ? 'bg-red-500/10 border-red-500/30' : 'glass-card'}`}>
			<div className="flex items-center justify-between mb-2">
				<div
					className={`p-2 rounded-lg ${abnormal ? 'bg-red-500/20 text-red-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
					{icon}
				</div>
				{abnormal && (
					<span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
						{t('vitals.abnormal')}
					</span>
				)}
			</div>
			<p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
				{title}
			</p>
			<div className="flex items-baseline gap-1 mt-1">
				<span
					className={`text-2xl font-bold ${abnormal ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
					{value}
				</span>
				<span className="text-sm font-medium text-slate-500">{unit}</span>
			</div>
		</div>
	);
}

function VitalsDisplay({ visitId }: { visitId: number }) {
	const { t } = useTranslation();
	const { data: vitals, isLoading } = useQuery({
		queryKey: ['vitals', visitId],
		queryFn: () => visitService.listVitalsByVisit(visitId),
	});

	if (isLoading)
		return (
			<div className="p-4 text-center text-sm text-slate-500 animate-pulse">
				{t('vitals.loadingVitals')}
			</div>
		);
	if (!vitals || vitals.length === 0)
		return (
			<div className="p-4 text-center text-sm text-slate-500">
				{t('vitals.noVitalSignsForVisit')}
			</div>
		);

	const v = vitals[0]; // Assuming one vitals record per visit for display simplicity

	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			exit={{ opacity: 0, height: 0 }}
			className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
			<h4 className="text-sm font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
				<Activity size={16} className="text-indigo-500" />
				{t('vitals.recordedVitalSigns')}
			</h4>
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
				{v.blood_pressure_sys && v.blood_pressure_dia && (
					<VitalCard
						title={t('vitals.bloodPressure')}
						value={`${v.blood_pressure_sys}/${v.blood_pressure_dia}`}
						unit="mmHg"
						icon={<Heart size={18} />}
						abnormal={
							isAbnormal('sys', v.blood_pressure_sys) ||
							isAbnormal('dia', v.blood_pressure_dia)
						}
					/>
				)}
				{v.heart_rate && (
					<VitalCard
						title={t('vitals.heartRateLabel')}
						value={v.heart_rate}
						unit="bpm"
						icon={<Activity size={18} />}
						abnormal={isAbnormal('hr', v.heart_rate)}
					/>
				)}
				{v.temperature && (
					<VitalCard
						title={t('vitals.temperatureLabel')}
						value={v.temperature}
						unit="°C"
						icon={<Thermometer size={18} />}
						abnormal={isAbnormal('temp', v.temperature)}
					/>
				)}
				{v.spo2 && (
					<VitalCard
						title={t('vitals.spo2')}
						value={v.spo2}
						unit="%"
						icon={<Droplet size={18} />}
						abnormal={isAbnormal('spo2', v.spo2)}
					/>
				)}
				{v.respiratory_rate && (
					<VitalCard
						title={t('vitals.respiratoryRateLabel')}
						value={v.respiratory_rate}
						unit={t('vitals.breathsPerMin')}
						icon={<Wind size={18} />}
						abnormal={isAbnormal('rr', v.respiratory_rate)}
					/>
				)}
				{v.weight_kg && (
					<VitalCard
						title={t('vitals.weightLabel')}
						value={v.weight_kg}
						unit="kg"
						icon={<Scale size={18} />}
						abnormal={false}
					/>
				)}
			</div>
			{v.notes && (
				<div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
					<span className="font-semibold text-slate-700 dark:text-slate-300">
						{t('common.notes')}:{' '}
					</span>
					{v.notes}
				</div>
			)}
		</motion.div>
	);
}

function VisitCard({ visit }: { visit: ClinicVisitRpcItem }) {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="glass-card p-5 mb-4 hover:shadow-md transition-shadow">
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
				onClick={() => setExpanded(!expanded)}>
				<div className="flex items-start gap-4">
					<div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
						<Calendar size={24} />
					</div>
					<div>
						<h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
							{formatDate(visit.visit_date)}
							<span className="text-sm font-normal text-slate-500">
								{t('vitals.atTime', { time: formatTime(visit.visit_date) })}
							</span>
						</h3>
						<div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
							<span className="flex items-center gap-1">
								<UserIcon size={14} /> {t('common.doctorPrefix')}{' '}
								{visit.doctor_name || visit.doctor_id}
							</span>
							<span className="flex items-center gap-1">
								<FileText size={14} /> {visit.reason_for_visit}
							</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<button className="text-sm font-medium text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
						{expanded ? (
							<>
								<ChevronUp size={16} /> {t('vitals.hideVitals')}
							</>
						) : (
							<>
								<ChevronDown size={16} /> {t('vitals.showVitals')}
							</>
						)}
					</button>
				</div>
			</div>

			<AnimatePresence>
				{expanded && <VitalsDisplay visitId={visit.visit_id} />}
			</AnimatePresence>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function FormDiagnosisSelect({ patientsData }: { patientsData: any }) {
	const { t } = useTranslation();
	const { input } = useField('p_patient_id');
	const patientId = input.value;

	const patientName =
		patientsData?.data?.find(
			(p: any) => String(p.patient_id) === String(patientId),
		)?.full_name || '';

	const { data: diagnosesData } = useQuery({
		queryKey: ['diagnoses-list', patientName],
		queryFn: () => diagnosisService.getByPatientName(patientName),
		enabled: !!patientName,
	});

	const diagnosisOptions =
		diagnosesData?.map((d) => ({
			value: String(d.diagnosis_id),
			label: `${d.cancer_name || t('vitals.unknownCancer')} (${formatDate(
				d.diagnosis_date,
			)})`,
		})) || [];

	return (
		<FormField
			name="p_diagnosis_id"
			label={t('vitals.relatedDiagnosisOptional')}
			type="select"
			options={diagnosisOptions}
		/>
	);
}


export default function VitalsPage() {
	const { t } = useTranslation();
	const qc = useQueryClient();
	const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
		null,
	);
	const [showForm, setShowForm] = useState(false);

	// Fetch Options
	const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
		queryKey: ['patients-list'],
		queryFn: () => patientService.getAll({ page: 1, pageSize: 100 }),
	});

	const { data: doctorsData } = useQuery({
		queryKey: ['doctors-list'],
		queryFn: () => doctorService.getAll(),
	});

	// Fetch Visits for Selected Patient
	const { data: visits, isLoading: isLoadingVisits } = useQuery({
		queryKey: ['clinic-visits', selectedPatientId],
		queryFn: () => visitService.listVisitsByPatient(selectedPatientId || NaN),
		enabled: !!selectedPatientId,
	});

	// Mutations
	const createMut = useMutation({
		mutationFn: async (d: CombinedVisitForm) => {
			if (d.include_vitals) {
				return visitService.createVisitWithVitals({
					p_patient_id: Number(d.p_patient_id),
					p_doctor_id: Number(d.p_doctor_id),
					p_diagnosis_id: d.p_diagnosis_id ? Number(d.p_diagnosis_id) : null,
					p_visit_date: d.p_visit_date,
					p_visit_type: d.p_visit_type || undefined,
					p_reason_for_visit: d.p_reason_for_visit,
					p_clinical_notes: d.p_clinical_notes || undefined,
					p_recommendations: d.p_recommendations || undefined,
					p_next_visit_date: d.p_next_visit_date || undefined,
					p_temperature: d.p_temperature ? Number(d.p_temperature) : null,
					p_blood_pressure_sys: d.p_blood_pressure_sys
						? Number(d.p_blood_pressure_sys)
						: null,
					p_blood_pressure_dia: d.p_blood_pressure_dia
						? Number(d.p_blood_pressure_dia)
						: null,
					p_heart_rate: d.p_heart_rate ? Number(d.p_heart_rate) : null,
					p_respiratory_rate: d.p_respiratory_rate
						? Number(d.p_respiratory_rate)
						: null,
					p_spo2: d.p_spo2 ? Number(d.p_spo2) : null,
					p_weight_kg: d.p_weight_kg ? Number(d.p_weight_kg) : null,
					p_height_cm: d.p_height_cm ? Number(d.p_height_cm) : null,
					p_vital_notes: d.p_vital_notes || null,
				});
			} else {
				return visitService.createVisit({
					p_patient_id: Number(d.p_patient_id),
					p_doctor_id: Number(d.p_doctor_id),
					p_diagnosis_id: d.p_diagnosis_id ? Number(d.p_diagnosis_id) : null,
					p_visit_date: d.p_visit_date,
					p_visit_type: d.p_visit_type || undefined,
					p_reason_for_visit: d.p_reason_for_visit,
					p_clinical_notes: d.p_clinical_notes || undefined,
					p_recommendations: d.p_recommendations || undefined,
					p_next_visit_date: d.p_next_visit_date || undefined,
				});
			}
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['clinic-visits'] });
			toast.success(t('vitals.visitScheduledSuccess'));
			setShowForm(false);
		},
		onError: (err: any) =>
			toast.error(err.message || t('vitals.scheduleVisitFailed')),
	});

	const filterPatientOptions =
		patientsData?.data.map((p) => ({
			value: String(p.patient_id),
			label: p.full_name,
		})) || [];
	const formPatientOptions =
		patientsData?.data.map((p) => ({
			value: String(p.patient_id),
			label: p.full_name,
		})) || [];
	const doctorOptions =
		doctorsData?.map((d) => ({
			value: String(d.doctor_id),
			label: d.full_name,
		})) || [];

	const defaultPatientIdFormValue =
		patientsData?.data.find((p) => String(p.patient_id) === String(selectedPatientId))?.patient_id ?? '';

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold text-slate-900 dark:text-white">
						{t('vitals.clinicVisitsAndVitals')}
					</h1>
					<p className="text-sm text-slate-500">
						{t('vitals.manageVisitsAndTrackVitals')}
					</p>
				</div>
				<button
					onClick={() => setShowForm(true)}
					className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
					<Plus size={16} /> {t('visits.scheduleVisit')}
				</button>
			</div>

			<div className="glass-card p-4">
				<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
					{t('vitals.selectPatient')}
				</label>
				{isLoadingPatients ? (
					<div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-full max-w-md"></div>
				) : (
					<select
						value={selectedPatientId || ''}
						onChange={(e) => setSelectedPatientId(Number(e.target.value))}
						className="input-field max-w-md">
						<option value="">{t('vitals.choosePatientOption')}</option>
						{filterPatientOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				)}
			</div>

			{!selectedPatientId ? (
				<div className="text-center py-12 glass-card">
					<div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
						<UserIcon size={32} />
					</div>
					<h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
						{t('vitals.noPatientSelected')}
					</h3>
					<p className="text-slate-500">
						{t('vitals.selectPatientToViewVisits')}
					</p>
				</div>
			) : isLoadingVisits ? (
				<div className="space-y-4">
					{[1, 2].map((i) => (
						<div
							key={i}
							className="glass-card p-5 h-24 animate-pulse bg-slate-100/50 dark:bg-slate-800/50"></div>
					))}
				</div>
			) : visits && visits.length > 0 ? (
				<div className="space-y-4">
					{visits.map((visit) => (
						<VisitCard key={visit.visit_id} visit={visit} />
					))}
				</div>
			) : (
				<div className="text-center py-12 glass-card border-dashed">
					<h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
						{t('vitals.noVisitsFound')}
					</h3>
					<p className="text-slate-500">
						{t('vitals.noRecordedClinicVisits')}
					</p>
					<button
						onClick={() => setShowForm(true)}
						className="mt-4 text-indigo-500 font-medium hover:underline">
						{t('vitals.scheduleFirstVisit')}
					</button>
				</div>
			)}

			{/* ── Create Visit Modal ── */}
			<Modal
				isOpen={showForm}
				onClose={() => setShowForm(false)}
				title={t('visits.scheduleTitle')}
				size="xl">
				<AppForm<CombinedVisitForm>
					initialValues={{
						...DEFAULT_FORM_VALUES,
						p_patient_id: String(defaultPatientIdFormValue),
					}}
					validate={zodValidator(combinedVisitSchema)}
					onSubmit={(d) => createMut.mutate(d)}
					className="space-y-6">
					<div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
						<h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
							<Calendar size={16} className="text-indigo-500" /> {t('vitals.visitDetails')}
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<FormField
								name="p_patient_id"
								label={t('diagnoses.patient')}
								type="select"
								options={formPatientOptions}
								placeholder={t('vitals.selectPatientPlaceholder')}
								required
							/>
							<FormField
								name="p_doctor_id"
								label={t('diagnoses.doctor')}
								type="select"
								options={doctorOptions}
								required
							/>
							<FormField
								name="p_visit_date"
								label={t('visits.dateTime')}
								type="datetime-local"
								required
							/>
							<FormField
								name="p_visit_type"
								label={t('visits.visitType')}
								type="select"
								required
								options={[
									{ value: 'Routine', label: t('visits.routine') },
									{ value: 'Follow-up', label: t('visits.followUp') },
									{ value: 'Emergency', label: t('visits.emergency') },
									{ value: 'Post-treatment', label: t('visits.postTreatment') },
								]}
							/>
							<FormDiagnosisSelect patientsData={patientsData} />
						</div>
						<FormField
							name="p_reason_for_visit"
							label={t('visits.reasonForVisit')}
							type="textarea"
							required
						/>
						<FormField
							name="p_clinical_notes"
							label={t('visits.consultationNotes')}
							type="textarea"
						/>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<FormField
								name="p_recommendations"
								label={t('visits.recommendations')}
								type="textarea"
							/>
							<FormField
								name="p_next_visit_date"
								label={t('visits.nextVisitDate')}
								type="date"
							/>
						</div>
					</div>

					<Field name="include_vitals" type="checkbox">
						{({ input }) => (
							<div className="space-y-4">
								<label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
									<div
										className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${input.checked ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
										<span
											className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${input.checked ? 'translate-x-5' : 'translate-x-0'}`}
										/>
									</div>
									<span className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
										<Activity
											size={16}
											className={
												input.checked ? 'text-indigo-500' : 'text-slate-400'
											}
										/>
										{t('vitals.recordVitalSignsNow')}
									</span>
								</label>

								<AnimatePresence>
									{input.checked && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											className="overflow-hidden">
											<div className="bg-indigo-50 dark:bg-indigo-500/5 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 space-y-4">
												<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
													<FormField
														name="p_blood_pressure_sys"
													label={t('vitals.sysBpMmhg')}
														type="number"
													/>
													<FormField
														name="p_blood_pressure_dia"
													label={t('vitals.diaBpMmhg')}
														type="number"
													/>
													<FormField
														name="p_heart_rate"
													label={t('vitals.heartRate')}
														type="number"
													/>
													<FormField
														name="p_temperature"
													label={t('vitals.temperature')}
														type="number"
													/>
													<FormField
														name="p_spo2"
													label={t('vitals.oxygenSaturation')}
														type="number"
													/>
													<FormField
														name="p_respiratory_rate"
													label={t('vitals.respRate')}
														type="number"
													/>
													<FormField
														name="p_weight_kg"
													label={t('vitals.weight')}
														type="number"
													/>
													<FormField
														name="p_height_cm"
													label={t('vitals.height')}
														type="number"
													/>
												</div>
												<FormField
													name="p_vital_notes"
												label={t('vitals.vitalsNotes')}
													type="textarea"
												/>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}
					</Field>

					<div className="flex justify-end pt-2">
						<button
							type="submit"
							disabled={createMut.isPending}
							className="gradient-btn px-6 py-2.5 text-sm">
							{createMut.isPending ? t('vitals.scheduling') : t('visits.scheduleVisit')}
						</button>
					</div>
				</AppForm>
			</Modal>
		</motion.div>
	);
}
