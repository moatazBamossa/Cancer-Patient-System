import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { diagnosisService } from '../../services/diagnosis.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { AppForm } from '../../components/ui/AppForm';
import { FormField, FormSelectField } from '../../components/ui/FormField';
import { zodValidator } from '../../lib/zodValidator';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { Diagnosis } from '../../types';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { patientService } from '../../services/patient.service';
import { doctorService } from '../../services/doctor.service';

export default function DiagnosesPage() {
	const { t } = useTranslation();
	const qc = useQueryClient();
	const store = getDataStore();
	const [showForm, setShowForm] = useState(false);
	const [editDiagnosis, setEditDiagnosis] = useState<Diagnosis | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Diagnosis | null>(null);
	const [page, setPage] = useState(1);

	const [searchInput, setSearchInput] = useState('');
	const [selectedPatientId, setSelectedPatientId] = useState<string>('');

	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchInput !== selectedPatientId) {
				setSelectedPatientId(searchInput);
				setPage(1);
			}
		}, 1000);
		return () => clearTimeout(timer);
	}, [searchInput, selectedPatientId]);

	const diagSchema = z.object({
		patient_id: z.string().min(1, t('diagnoses.patientRequired')),
		cancer_id: z.string().min(1, t('diagnoses.cancerTypeRequired')),
		supervising_doctor_id: z.string().min(1, t('diagnoses.doctorRequired')),
		diagnosis_date: z.string().min(1, t('diagnoses.dateRequired')),
		notes: z.string().min(1, t('diagnoses.notesRequired')),
		status: z.enum(['active', 'resolved', 'transferred']),
	});

	type DiagForm = z.infer<typeof diagSchema>;

	const { data, isLoading } = useQuery({
		queryKey: ['diagnoses', page, selectedPatientId],
		queryFn: async () => {
			if (selectedPatientId) {
				const diags = await diagnosisService.getByPatientName(selectedPatientId);
				// Paginate locally for the selected patient
				const startIndex = (page - 1) * 10;
				const endIndex = startIndex + 10;
				return {
					data: diags.slice(startIndex, endIndex),
					total: diags.length,
					page,
					pageSize: 10,
					totalPages: Math.ceil(diags.length / 10),
				};
			}
			return diagnosisService.getAll({ page, pageSize: 10 });
		},
	});

	const { data: patientsData, isLoading: isPatientsLoading } = useQuery({
		queryKey: ['patients', page],
		queryFn: () =>
			patientService.getAll({
				page: 1,
				pageSize: 100, // Fetch more patients for the dropdown
			}),
		enabled: true,
		select: (patients) =>
			patients.data.map((p) => ({
				value: p.patient_id,
				label: p.full_name ?? '',
			})),
	});

	const { data: cancerTypesData, isLoading: isCancerTypesLoading } = useQuery({
		queryKey: ['cancer-types'],
		queryFn: () => diagnosisService.getCancerTypes(),
		enabled: true,
		select: (cancerTypes) =>
			cancerTypes.map((ct) => ({
				value: String(ct.cancer_id),
				label: ct.cancer_name ?? '',
			})),
	});

	const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
		queryKey: ['doctors'],
		queryFn: () => doctorService.getAll(),
	});

	const createMut = useMutation({
		mutationFn: (d: DiagForm) => diagnosisService.create(d),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['diagnoses'] });
			toast.success(t('diagnoses.created'));
			setShowForm(false);
		},
	});

	const updateMut = useMutation({
		mutationFn: (d: DiagForm) =>
			diagnosisService.update(editDiagnosis!.diagnosis_id, d),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['diagnoses'] });
			toast.success(t('common.updateSuccess'));
			setShowForm(false);
			setEditDiagnosis(null);
		},
	});

	const deleteMut = useMutation({
		mutationFn: (id: string) => diagnosisService.delete(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['diagnoses'] });
			toast.success(t('common.deleteSuccess'));
			setDeleteTarget(null);
		},
	});

	const defaultDiagValues: DiagForm = {
		patient_id: '',
		cancer_id: '',
		supervising_doctor_id: '',
		diagnosis_date: '',
		notes: '',
		status: 'active',
	};
	const [formInitialValues, setFormInitialValues] =
		useState<DiagForm>(defaultDiagValues);
	const [formKey, setFormKey] = useState(0);

	const openAddForm = () => {
		setEditDiagnosis(null);
		setFormInitialValues({ ...defaultDiagValues, status: 'active' });
		setFormKey((k) => k + 1);
		setShowForm(true);
	};

	const handleEdit = (diag: Diagnosis) => {
		setEditDiagnosis(diag);

		setFormInitialValues({
			patient_id: String(diag.patient_id),
			cancer_id: String(diag.cancer_id),
			supervising_doctor_id: String(diag.supervising_doctor_id),
			diagnosis_date: String(diag.diagnosis_date).split('T')[0],
			notes: diag.notes,
			status: diag.status as DiagForm['status'],
		});
		setFormKey((k) => k + 1);
		setShowForm(true);
	};

	const columns: Column<Diagnosis>[] = [
		{
			key: 'patient_id',
			header: t('diagnoses.patient'),
			render: (v, row) => {
				// Use resolved name if available, fallback to store if newly added on client

				const displayName = row.patient_name || '--';
				return (
					<span
						className="font-medium"
						style={{ color: 'var(--text-primary)' }}>
						{displayName || t('common.unknown')}
					</span>
				);
			},
		},
		{
			key: 'cancer_id',
			header: t('diagnoses.cancerType'),
			render: (v, row) => {
				const displayCancerName = row.cancer_name || '--';
				const displayCancerColor = row.cancer_color || '--';

				return displayCancerName ? (
					<div className="flex items-center gap-2">
						<span
							className="w-2.5 h-2.5 rounded-full"
							style={{ background: displayCancerColor }}
						/>
						{displayCancerName}
					</div>
				) : (
					t('common.unknown')
				);
			},
		},
		{
			key: 'supervising_doctor_id',
			header: t('diagnoses.doctor'),
			render: (v, row) => {
				const doc = doctors.find((d) => d.doctor_id === String(v));
				const displayDoctorName =
					row.doctor_name || (doc ? doc.full_name : null);
				return displayDoctorName ? `${displayDoctorName}` : t('common.unknown');
			},
		},
		{
			key: 'diagnosis_date',
			header: t('common.date'),
			sortable: true,
			render: (v) => formatDate(String(v)),
		},
		{
			key: 'status',
			header: t('common.status.label'),
			render: (v) => <StatusBadge status={String(v) as any} />,
		},
	];
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="space-y-4">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1
						className="text-xl font-bold"
						style={{ color: 'var(--text-primary)' }}>
						{t('diagnoses.title')}
					</h1>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						{t('diagnoses.subtitle')}
					</p>
				</div>

				<div className="w-full sm:w-64 relative">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Search size={16} style={{ color: 'var(--text-muted)' }} />
					</div>
					<input
						type="text"
						placeholder={
							t('diagnoses.searchByPatientId') || 'Search by Patient ID...'
						}
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="w-full pl-10 p-2 text-sm rounded-lg border focus:ring-2 focus:outline-none"
						style={{
							background: 'var(--bg-tertiary)',
							borderColor: 'var(--border-color)',
							color: 'var(--text-primary)',
						}}
					/>
				</div>
			</div>

			<DataTable<Diagnosis>
				columns={columns}
				data={data?.data || []}
				totalItems={data?.total}
				page={page}
				pageSize={10}
				onPageChange={setPage}
				isLoading={
					isLoading ||
					isCancerTypesLoading ||
					isPatientsLoading ||
					doctorsLoading
				}
				headerActions={
					<button
						onClick={openAddForm}
						className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
						<Plus size={16} /> {t('diagnoses.addDiagnosis')}
					</button>
				}
				actions={(row) => (
					<div className="flex items-center gap-1">
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleEdit(row);
							}}
							className="p-1.5 rounded-lg transition-colors hover:bg-amber-500/10"
							style={{ color: 'var(--text-muted)' }}>
							<Edit2 size={16} />
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation();
								setDeleteTarget(row);
							}}
							className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
							style={{ color: 'var(--text-muted)' }}>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>
			<Modal
				isOpen={showForm}
				onClose={() => {
					setShowForm(false);
					setEditDiagnosis(null);
				}}
				title={editDiagnosis ? t('common.edit') : t('diagnoses.addDiagnosis')}
				size="lg">
				<AppForm<DiagForm>
					formKey={formKey}
					initialValues={formInitialValues}
					validate={zodValidator(diagSchema)}
					onSubmit={(d) =>
						editDiagnosis ? updateMut.mutate(d) : createMut.mutate(d)
					}
					className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<FormSelectField
							options={patientsData || []}
							name="patient_id"
							label={t('diagnoses.patient')}
							required
						/>
						<FormSelectField
							name="cancer_id"
							label={t('diagnoses.cancerType')}
							required
							options={cancerTypesData || []}
						/>
						<FormSelectField
							name="supervising_doctor_id"
							label={t('diagnoses.doctor')}
							required
							options={doctors.map((d) => ({
								value: String(d.doctor_id),
								label: d.full_name,
							}))}
						/>
						<FormField
							name="diagnosis_date"
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
								{ value: 'active', label: t('common.status.active') },
								{ value: 'resolved', label: t('common.status.resolved') },
								{ value: 'transferred', label: t('common.status.transferred') },
							]}
						/>
					</div>
					<FormField
						name="notes"
						label={t('common.notes')}
						type="textarea"
						required
					/>
					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={createMut.isPending || updateMut.isPending}
							className="gradient-btn px-6 py-2.5 text-sm">
							{editDiagnosis
								? t('common.save')
								: t('diagnoses.createDiagnosis')}
						</button>
					</div>
				</AppForm>
			</Modal>

			<ConfirmDialog
				isOpen={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={() =>
					deleteTarget && deleteMut.mutate(deleteTarget.diagnosis_id)
				}
				title={t('common.delete')}
				message={t('common.confirm')}
			/>
		</motion.div>
	);
}
