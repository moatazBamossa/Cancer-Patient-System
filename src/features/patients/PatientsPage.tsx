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
      toast.success(t('patients.deleteSuccess', { defaultValue: 'Patient removed successfully' }));
    },
    onError: () => toast.error(t('patients.deleteError', { defaultValue: 'Failed to delete patient' })),
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
          Name: `${p.first_name} ${p.last_name}`,
          NationalID: p.national_id,
          Gender: p.gender,
          DOB: p.date_of_birth,
          Phone: p.phone,
          Email: p.email,
          Status: p.status,
          BloodType: p.blood_type,
        })),
        'patients_export'
      );
      toast.success('Exported successfully');
    }
  };

  const columns: Column<Patient>[] = [
    {
      key: 'first_name',
      header: t('common.patients').slice(0, -1),
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
               style={{ background: 'var(--accent-gradient)' }}>
            {row.first_name.charAt(0)}{row.last_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {row.first_name} {row.last_name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.national_id}</p>
          </div>
        </div>
      ),
    },
    { key: 'gender', header: t('patients.gender', { defaultValue: 'Gender' }), render: (v) => <span className="capitalize">{String(v)}</span> },
    { key: 'date_of_birth', header: t('patients.dob', { defaultValue: 'DOB' }), sortable: true, render: (v) => formatDate(String(v)) },
    { key: 'blood_type', header: t('patients.bloodType', { defaultValue: 'Blood' }), render: (v) => <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{String(v)}</span> },
    { key: 'phone', header: t('patients.phone', { defaultValue: 'Phone' }) },
    {
      key: 'status',
      header: t('common.status'),
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
            {t('patients.manageRecords', { defaultValue: 'Manage patient records' })}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as unknown as Record<string, unknown>[]}
        totalItems={data?.total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onSearch={debouncedSearch}
        onSort={(key, order) => { setSortBy(key); setSortOrder(order); }}
        searchPlaceholder={t('patients.searchPlaceholder', { defaultValue: 'Search by name, ID, or phone...' })}
        isLoading={isLoading}
        emptyMessage={t('patients.notFound', { defaultValue: 'No patients found' })}
        onRowClick={(row) => navigate(`/patients/${(row as unknown as Patient).id}`)}
        headerActions={
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-40 text-sm"
            >
              <option value="">{t('patients.allStatus', { defaultValue: 'All Status' })}</option>
              <option value="active">{t('patients.status.active', { defaultValue: 'Active' })}</option>
              <option value="inactive">{t('patients.status.inactive', { defaultValue: 'Inactive' })}</option>
              <option value="discharged">{t('patients.status.discharged', { defaultValue: 'Discharged' })}</option>
            </select>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              <Download size={16} /> CSV
            </button>
            <button onClick={() => { setEditPatient(null); setShowForm(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
              <Plus size={16} /> {t('common.add')} {t('common.patients').slice(0, -1)}
            </button>
          </div>
        }
        actions={(row) => {
          const patient = row as unknown as Patient;
          return (
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }} className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10" style={{ color: 'var(--text-muted)' }}>
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
        title={editPatient ? `${t('common.edit')} ${t('common.patients').slice(0, -1)}` : `${t('common.add')} ${t('common.patients').slice(0, -1)}`}
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
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t('patients.deleteTitle', { defaultValue: 'Delete Patient' })}
        message={t('patients.deleteConfirm', { 
          defaultValue: `Are you sure you want to remove ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This action can be reversed.`,
          name: `${deleteTarget?.first_name} ${deleteTarget?.last_name}`
        })}
        confirmText={t('common.delete')}
      />
    </motion.div>
  );
}
