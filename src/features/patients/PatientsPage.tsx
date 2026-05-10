import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientService } from '../../services/patient.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { PatientForm } from './PatientForm';
import { formatDate, exportToCSV, debounce } from '../../lib/utils';
import type { Patient } from '../../types';
import { useTranslation } from 'react-i18next';

export default function PatientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      patientService.getAll({
        page,
        pageSize,
        search,
        sortBy,
        sortOrder,
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(t('patients.deleteSuccess'));
    },
    onError: () => toast.error(t('patients.deleteError')),
  });

  const debouncedSearch = useCallback(
    debounce((q: string) => {
      setSearch(q);
      setPage(1);
    }, 400),
    []
  );

  const handleExport = () => {
    if (data?.data) {
      exportToCSV(
        data.data.map((p) => ({
          Name: p.full_name,
          NationalID: p.national_id,
          Gender: p.gender,
          BirthDate: p.birth_date,
          Phone: p.phone,
          Email: p.email,
          Status: p.status,
          BloodType: p.blood_type,
          Nationality: p.nationality,
        })),
        'patients_export'
      );
      toast.success(t('common.exportSuccess'));
    }
  };

  const columns: Column<Patient>[] = [
    {
      key: 'full_name',
      header: t('common.patient'),
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
               style={{ background: 'var(--accent-gradient)' }}>
            {row.full_name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {row.full_name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.national_id}</p>
          </div>
        </div>
      ),
    },
    { key: 'gender', header: t('patients.gender'), render: (v) => <span className="capitalize">{v === 'male' ? t('patients.male') : t('patients.female')}</span> },
    { key: 'birth_date', header: t('patients.dob'), sortable: true, render: (v) => formatDate(String(v)) },
    { key: 'blood_type', header: t('patients.bloodType'), render: (v) => <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{String(v)}</span> },
    { key: 'phone', header: t('patients.phone') },
    {
      key: 'status',
      header: t('common.status.label'),
      sortable: true,
      render: (v) => <StatusBadge status={String(v)} />,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('common.patients')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('patients.manageRecords')}
          </p>
        </div>
      </div>

      <DataTable<Patient>
        columns={columns}
        data={data?.data || []}
        totalItems={data?.total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onSearch={debouncedSearch}
        onSort={(key, order) => { setSortBy(key); setSortOrder(order); }}
        searchPlaceholder={t('patients.searchPlaceholder')}
        isLoading={isLoading}
        emptyMessage={t('patients.notFound')}
        onRowClick={(row) => navigate(`/patients/${(row as unknown as Patient).patient_id}`)}
        headerActions={
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-40 text-sm"
            >
              <option value="">{t('patients.allStatus')}</option>
              <option value="active">{t('patients.status.active')}</option>
              <option value="deceased">{t('patients.status.deceased')}</option>
              <option value="transferred">{t('patients.status.transferred')}</option>
            </select>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              <Download size={16} /> CSV
            </button>
            <button onClick={() => { setEditPatient(null); setShowForm(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
              <Plus size={16} /> {t('common.add')} {t('common.patient')}
            </button>
          </div>
        }
        actions={(row) => {
          const patient = row as unknown as Patient;
          return (
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.patient_id}`); }} className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10" style={{ color: 'var(--text-muted)' }}>
                <Eye size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setEditPatient(patient); setShowForm(true); }} className="p-1.5 rounded-lg transition-colors hover:bg-amber-500/10" style={{ color: 'var(--text-muted)' }}>
                <Edit2 size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(patient); }} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: 'var(--text-muted)' }}>
                <Trash2 size={16} />
              </button>
            </div>
          );
        }}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditPatient(null); }}
        title={editPatient ? `${t('common.update')} ${t('common.patient')}` : `${t('common.create')} ${t('common.patient')}`}
        size="lg"
      >
        <PatientForm
          patient={editPatient}
          onSuccess={() => {
            setShowForm(false);
            setEditPatient(null);
            queryClient.invalidateQueries({ queryKey: ['patients'] });
          }}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.patient_id)}
        title={t('patients.deleteTitle')}
        message={t('patients.deleteConfirm', { 
          name: deleteTarget?.full_name
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </motion.div>
  );
}
