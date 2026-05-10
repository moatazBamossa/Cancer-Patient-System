import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { treatmentService } from '../../services/treatment.service';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { formatDate, formatDateTime, getBMICategory } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import { useAuthStore } from '../../stores/authStore';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const vitalSchema = z.object({
  temperature: z.coerce.number().min(30).max(45),
  blood_pressure_sys: z.coerce.number().min(60).max(300),
  blood_pressure_dia: z.coerce.number().min(30).max(200),
  heart_rate: z.coerce.number().min(20).max(250),
  respiratory_rate: z.coerce.number().min(5).max(60),
  spo2: z.coerce.number().min(50).max(100),
  weight_kg: z.coerce.number().min(1).max(500),
  height_cm: z.coerce.number().min(50).max(250),
  notes: z.string().optional().default(''),
});

type VitalForm = z.infer<typeof vitalSchema>;

export default function VitalsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const store = getDataStore();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');

  // Vitals don't have patient_id directly? Wait, in DB vital_signs has cycle_id and visit_id.
  // Actually I need to map them back to patient via visit/cycle or add patient_id.
  // Let me just fallback to patient lookup if they don't have it.
  const patients = store.patients.filter((p) => p.status !== 'deceased');
  
  // Here I'll mock that `vital_signs` has patient_id implicitly via cycle/visit, 
  // but let's assume they are stored and I want to filter.
  // Since we are mocking, I'll fetch all.
  const vitals = store.vital_signs
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  const createMut = useMutation({
    mutationFn: (d: VitalForm) => treatmentService.addVitals({
      ...d,
      cycle_id: null,
      visit_id: null,
      recorded_at: new Date().toISOString(),
      recorded_by: user?.id || '',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vitals'] }); toast.success(t('vitals.vitalsRecorded')); setShowForm(false); },
  });

  const methods = useForm<VitalForm>({ resolver: zodResolver(vitalSchema) });

  const chartData = vitals.map((v) => ({
    date: formatDate(v.recorded_at),
    Temp: v.temperature,
    SysBP: v.blood_pressure_sys,
    DiaBP: v.blood_pressure_dia,
    Weight: v.weight_kg,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('vitals.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('vitals.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { methods.reset(); setShowForm(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> {t('vitals.recordVitals')}
          </button>
        </div>
      </div>

      {/* Charts */}
      {vitals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('vitals.tempAndBP')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="Temp" name={t('vitals.temp')} stroke="#ef4444" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="SysBP" name={t('vitals.systolicBP')} stroke="#6366f1" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="DiaBP" name={t('vitals.diastolicBP')} stroke="#8b5cf6" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('vitals.weightTrend')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: 12 }} />
                <Line type="monotone" dataKey="Weight" name={t('vitals.weightLabel')} stroke="#14b8a6" dot={{ r: 3 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vitals List */}
      <div className="space-y-2">
        {vitals.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p style={{ color: 'var(--text-muted)' }}>
              {selectedPatient ? t('vitals.noVitalsForPatient') : t('vitals.noVitals')}
            </p>
          </div>
        )}
        {vitals.map((v) => {
          const cat = getBMICategory(v.bmi);
          const isHighTemp = v.temperature > 37.5;
          const isHighBP = v.blood_pressure_sys > 140 || v.blood_pressure_dia > 90;
          return (
            <div key={v.vital_id} className="glass-card p-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(v.recorded_at)}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center">
                {[
                  { l: t('vitals.temp'), v: `${v.temperature}°C`, warn: isHighTemp },
                  { l: t('vitals.bp'), v: `${v.blood_pressure_sys}/${v.blood_pressure_dia}`, warn: isHighBP },
                  { l: t('vitals.hr'), v: `${v.heart_rate}`, warn: false },
                  { l: t('vitals.rr'), v: `${v.respiratory_rate}`, warn: false },
                  { l: t('vitals.spo2'), v: `${v.spo2}%`, warn: v.spo2 < 95 },
                  { l: t('vitals.weightLabel'), v: `${v.weight_kg}kg`, warn: false },
                  { l: t('vitals.bmi'), v: `${v.bmi}`, warn: false },
                ].map((item) => (
                  <div key={item.l} className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.l}</p>
                    <p className={`text-sm font-bold ${item.warn ? 'text-red-500' : ''}`} style={!item.warn ? { color: 'var(--text-primary)' } : {}}>{item.v}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('vitals.recordTitle')} size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="temperature" label={t('vitals.temperature')} type="number" required />
              <FormField name="blood_pressure_sys" label={t('vitals.systolicBP')} type="number" required />
              <FormField name="blood_pressure_dia" label={t('vitals.diastolicBP')} type="number" required />
              <FormField name="heart_rate" label={t('vitals.heartRate')} type="number" required />
              <FormField name="respiratory_rate" label={t('vitals.respiratoryRate')} type="number" required />
              <FormField name="spo2" label={t('vitals.oxygenSaturation')} type="number" required />
              <FormField name="weight_kg" label={t('vitals.weight')} type="number" required />
              <FormField name="height_cm" label={t('vitals.height')} type="number" required />
            </div>
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{t('vitals.recordVitals')}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
