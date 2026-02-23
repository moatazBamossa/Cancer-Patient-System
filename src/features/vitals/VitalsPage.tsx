import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { treatmentService } from '../../services/treatment.service';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { formatDate, formatDateTime, calculateBMI, getBMICategory } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import { useAuthStore } from '../../stores/authStore';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const vitalSchema = z.object({
  patient_id: z.string().min(1),
  temperature: z.number().min(30).max(45),
  systolic_bp: z.number().min(60).max(300),
  diastolic_bp: z.number().min(30).max(200),
  heart_rate: z.number().min(20).max(250),
  respiratory_rate: z.number().min(5).max(60),
  oxygen_saturation: z.number().min(50).max(100),
  weight: z.number().min(1).max(500),
  height: z.number().min(50).max(250),
});

type VitalForm = z.infer<typeof vitalSchema>;

export default function VitalsPage() {
  const qc = useQueryClient();
  const store = getDataStore();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');

  const patients = store.patients.filter((p) => !p.is_deleted);
  const vitals = store.vital_signs
    .filter((v) => !selectedPatient || v.patient_id === selectedPatient)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  const createMut = useMutation({
    mutationFn: (d: VitalForm) => treatmentService.addVitals({
      ...d,
      recorded_at: new Date().toISOString(),
      recorded_by: user?.id || '',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vitals'] }); toast.success('Vitals recorded'); setShowForm(false); },
  });

  const methods = useForm<VitalForm>({ resolver: zodResolver(vitalSchema) });

  const chartData = vitals.map((v) => ({
    date: formatDate(v.recorded_at),
    Temp: v.temperature,
    SysBP: v.systolic_bp,
    DiaBP: v.diastolic_bp,
    Weight: v.weight,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Vital Signs</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Monitor patient vitals</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="input-field w-48 text-sm">
            <option value="">All Patients</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
          <button onClick={() => { methods.reset(); setShowForm(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> Record Vitals
          </button>
        </div>
      </div>

      {/* Charts */}
      {vitals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Temperature & Blood Pressure</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="Temp" stroke="#ef4444" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="SysBP" stroke="#6366f1" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="DiaBP" stroke="#8b5cf6" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Weight Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: 12 }} />
                <Line type="monotone" dataKey="Weight" stroke="#14b8a6" dot={{ r: 3 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vitals List */}
      <div className="space-y-2">
        {vitals.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p style={{ color: 'var(--text-muted)' }}>No vitals recorded{selectedPatient ? ' for this patient' : ''}</p>
          </div>
        )}
        {vitals.map((v) => {
          const p = patients.find((pt) => pt.id === v.patient_id);
          const bmi = calculateBMI(v.weight, v.height);
          const cat = getBMICategory(bmi);
          const isHighTemp = v.temperature > 37.5;
          const isHighBP = v.systolic_bp > 140 || v.diastolic_bp > 90;
          return (
            <div key={v.id} className="glass-card p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p?.first_name} {p?.last_name}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(v.recorded_at)}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center">
                {[
                  { l: 'Temp', v: `${v.temperature}°C`, warn: isHighTemp },
                  { l: 'BP', v: `${v.systolic_bp}/${v.diastolic_bp}`, warn: isHighBP },
                  { l: 'HR', v: `${v.heart_rate}`, warn: false },
                  { l: 'RR', v: `${v.respiratory_rate}`, warn: false },
                  { l: 'SpO₂', v: `${v.oxygen_saturation}%`, warn: v.oxygen_saturation < 95 },
                  { l: 'Weight', v: `${v.weight}kg`, warn: false },
                  { l: 'BMI', v: `${bmi}`, warn: false },
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

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Record Vital Signs" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
            <FormField name="patient_id" label="Patient" type="select" required options={patients.map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="temperature" label="Temperature (°C)" type="number" required />
              <FormField name="systolic_bp" label="Systolic BP" type="number" required />
              <FormField name="diastolic_bp" label="Diastolic BP" type="number" required />
              <FormField name="heart_rate" label="Heart Rate (bpm)" type="number" required />
              <FormField name="respiratory_rate" label="Respiratory Rate" type="number" required />
              <FormField name="oxygen_saturation" label="SpO₂ (%)" type="number" required />
              <FormField name="weight" label="Weight (kg)" type="number" required />
              <FormField name="height" label="Height (cm)" type="number" required />
            </div>
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">Record Vitals</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
