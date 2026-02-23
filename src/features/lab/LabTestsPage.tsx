import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, FlaskConical, Activity } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { labService } from '../../services/general.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { LabTest, LabTestResult } from '../../types';

const testSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  normal_range_min: z.number().nullable().optional(),
  normal_range_max: z.number().nullable().optional(),
  description: z.string().min(1),
});

const resultSchema = z.object({
  patient_id: z.string().min(1),
  lab_test_id: z.string().min(1),
  value: z.number(),
  date: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(['normal', 'low', 'high', 'critical']),
});

type TestForm = z.infer<typeof testSchema>;
type ResultForm = z.infer<typeof resultSchema>;

export default function LabTestsPage() {
  const qc = useQueryClient();
  const store = getDataStore();
  const [showTestForm, setShowTestForm] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTest, setSelectedTest] = useState('');

  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: () => labService.getTests(),
  });

  const results = store.lab_test_results
    .filter((r) => (!selectedPatient || r.patient_id === selectedPatient) && (!selectedTest || r.lab_test_id === selectedTest))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const createTestMut = useMutation({
    mutationFn: (d: TestForm) => labService.addTest({ ...d, normal_range_min: d.normal_range_min ?? null, normal_range_max: d.normal_range_max ?? null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-tests'] }); toast.success('Test definition added'); setShowTestForm(false); },
  });

  const createResultMut = useMutation({
    mutationFn: (d: ResultForm) => labService.addResult({ ...d, ordered_by: 'user-2', notes: d.notes || '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-results'] }); toast.success('Result recorded'); setShowResultForm(false); },
  });

  const testMethods = useForm<TestForm>({ resolver: zodResolver(testSchema) });
  const resultMethods = useForm<ResultForm>({ resolver: zodResolver(resultSchema), defaultValues: { status: 'normal' } });

  const columns: Column<LabTestResult>[] = [
    { key: 'date', header: 'Date', render: (v) => formatDate(String(v)) },
    { key: 'patient_id', header: 'Patient', render: (v) => {
      const p = store.patients.find(pt => pt.id === v);
      return p ? `${p.first_name} ${p.last_name}` : 'Unknown';
    }},
    { key: 'lab_test_id', header: 'Test', render: (v) => store.lab_tests.find(t => t.id === v)?.name || 'Unknown' },
    { key: 'value', header: 'Result', render: (v, row) => {
      const t = store.lab_tests.find(test => test.id === row.lab_test_id);
      return <span className="font-bold">{String(v)} {t?.unit}</span>;
    }},
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
  ];

  const chartData = results.filter(r => r.lab_test_id === selectedTest).map(r => ({
    date: formatDate(r.date),
    value: r.value,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Laboratory Tests</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Monitor lab results and trends</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTestForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <Plus size={16} /> New Test Def
          </button>
          <button onClick={() => setShowResultForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> Add Result
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center p-4 glass-card">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Filter by Patient</label>
          <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="input-field text-sm">
            <option value="">All Patients</option>
            {store.patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Filter by Test</label>
          <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)} className="input-field text-sm">
            <option value="">All Tests</option>
            {store.lab_tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {selectedTest && chartData.length > 1 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" />
            {store.lab_tests.find(t => t.id === selectedTest)?.name} Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--accent-primary)' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <DataTable
        columns={columns}
        data={results as unknown as Record<string, unknown>[]}
        isLoading={testsLoading}
        emptyMessage="No lab results matching filters"
      />

      {/* New Test Modal */}
      <Modal isOpen={showTestForm} onClose={() => setShowTestForm(false)} title="Define New Lab Test" size="md">
        <FormProvider {...testMethods}>
          <form onSubmit={testMethods.handleSubmit(d => createTestMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="name" label="Test Name" required />
              <FormField name="code" label="Code" required />
              <FormField name="category" label="Category" required />
              <FormField name="unit" label="Unit" required />
              <FormField name="normal_range_min" label="Normal Min" type="number" />
              <FormField name="normal_range_max" label="Normal Max" type="number" />
            </div>
            <FormField name="description" label="Description" type="textarea" required />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">Define Test</button></div>
          </form>
        </FormProvider>
      </Modal>

      {/* Add Result Modal */}
      <Modal isOpen={showResultForm} onClose={() => setShowResultForm(false)} title="Add Lab Result" size="md">
        <FormProvider {...resultMethods}>
          <form onSubmit={resultMethods.handleSubmit(d => createResultMut.mutate(d))} className="space-y-4">
            <FormField name="patient_id" label="Patient" type="select" required options={store.patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
            <FormField name="lab_test_id" label="Lab Test" type="select" required options={store.lab_tests.map(t => ({ value: t.id, label: t.name }))} />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="value" label="Value" type="number" required />
              <FormField name="date" label="Test Date" type="date" required />
              <FormField name="status" label="Status" type="select" options={[
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Low' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]} />
            </div>
            <FormField name="notes" label="Notes" type="textarea" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">Save Result</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
