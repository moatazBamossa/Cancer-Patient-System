import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Stethoscope, FileBarChart, Activity, Pill,
  FlaskConical, ImageIcon, Calendar, Phone, Printer,
} from 'lucide-react';
import { patientService } from '../../services/patient.service';
import { diagnosisService } from '../../services/diagnosis.service';
import { treatmentService } from '../../services/treatment.service';
import { labService, imagingService } from '../../services/general.service';
import { doctorService } from '../../services/doctor.service';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { formatDate, formatDateTime, calculateBMI, getBMICategory } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'diagnoses', label: 'Diagnoses', icon: Stethoscope },
  { id: 'treatment', label: 'Treatment', icon: FileBarChart },
  { id: 'vitals', label: 'Vitals', icon: Activity },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'lab', label: 'Lab Results', icon: FlaskConical },
  { id: 'imaging', label: 'Imaging', icon: ImageIcon },
  { id: 'visits', label: 'Visits', icon: Calendar },
  { id: 'contacts', label: 'Contacts', icon: Phone },
];

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const store = getDataStore();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id!),
    enabled: !!id,
  });

  const { data: diagnoses } = useQuery({
    queryKey: ['patient-diagnoses', id],
    queryFn: () => diagnosisService.getByPatientId(id!),
    enabled: !!id,
  });

  const { data: plans } = useQuery({
    queryKey: ['patient-plans', id],
    queryFn: () => treatmentService.getPlansByPatient(id!),
    enabled: !!id,
  });

  const { data: cycles } = useQuery({
    queryKey: ['patient-cycles', id],
    queryFn: () => treatmentService.getCyclesByPatient(id!),
    enabled: !!id,
  });

  const { data: vitals } = useQuery({
    queryKey: ['patient-vitals', id],
    queryFn: () => treatmentService.getVitalsByPatient(id!),
    enabled: !!id,
  });

  const { data: labResults } = useQuery({
    queryKey: ['patient-lab', id],
    queryFn: () => labService.getResultsByPatient(id!),
    enabled: !!id,
  });

  const { data: imaging } = useQuery({
    queryKey: ['patient-imaging', id],
    queryFn: () => imagingService.getByPatient(id!),
    enabled: !!id,
  });

  const { data: visits } = useQuery({
    queryKey: ['patient-visits', id],
    queryFn: () => doctorService.getVisitsByPatient(id!),
    enabled: !!id,
  });

  const { data: contacts } = useQuery({
    queryKey: ['patient-contacts', id],
    queryFn: () => patientService.getEmergencyContacts(id!),
    enabled: !!id,
  });

  if (isLoading) return <PageSkeleton />;
  if (!patient) return <div>Patient not found</div>;

  const age = Math.floor(
    (Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/patients')} className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                 style={{ background: 'var(--accent-gradient)' }}>
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {patient.first_name} {patient.last_name}
                <StatusBadge status={patient.status} />
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {patient.national_id} • {age} years • {patient.gender} • {patient.blood_type}
              </p>
            </div>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium no-print" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          <Printer size={16} /> Print
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-print">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'text-white' : ''
            }`}
            style={
              activeTab === tab.id
                ? { background: 'var(--accent-gradient)' }
                : { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
            }
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
              {[
                ['Phone', patient.phone],
                ['Email', patient.email],
                ['Address', patient.address],
                ['DOB', formatDate(patient.date_of_birth)],
                ['Blood Type', patient.blood_type],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Summary</h3>
              {[
                ['Diagnoses', diagnoses?.length ?? 0],
                ['Treatment Plans', plans?.length ?? 0],
                ['Active Cycles', cycles?.filter((c) => c.status === 'in_progress').length ?? 0],
                ['Lab Results', labResults?.length ?? 0],
                ['Imaging Reports', imaging?.length ?? 0],
                ['Clinic Visits', visits?.length ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'diagnoses' && (
          <div className="space-y-3">
            {diagnoses?.length === 0 && <EmptyState message="No diagnoses recorded" />}
            {diagnoses?.map((d) => {
              const ct = store.cancer_types.find((c) => c.id === d.cancer_type_id);
              const doc = store.doctors.find((dc) => dc.id === d.doctor_id);
              const docUser = doc ? store.users.find((u) => u.id === doc.user_id) : null;
              return (
                <div key={d.id} className="glass-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full" style={{ background: ct?.color }} />
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{ct?.name}</h4>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(d.diagnosis_date)} • Dr. {docUser?.full_name}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{d.notes}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'treatment' && (
          <div className="space-y-3">
            {plans?.length === 0 && <EmptyState message="No treatment plans" />}
            {plans?.map((tp) => (
              <div key={tp.id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{tp.title}</h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(tp.start_date)}{tp.end_date ? ` — ${formatDate(tp.end_date)}` : ' — Ongoing'}
                    </p>
                  </div>
                  <StatusBadge status={tp.status} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tp.description}</p>
                {/* Cycles */}
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Cycles</p>
                  <div className="flex gap-2 flex-wrap">
                    {cycles?.filter((c) => c.treatment_plan_id === tp.id).map((c) => (
                      <div key={c.id} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        Cycle {c.cycle_number} • <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-4">
            {vitals && vitals.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Vital Signs Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vitals.map((v) => ({
                    date: formatDate(v.recorded_at),
                    Temp: v.temperature,
                    Weight: v.weight,
                    HR: v.heart_rate,
                    SpO2: v.oxygen_saturation,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: 12 }} />
                    <Line type="monotone" dataKey="Temp" stroke="#ef4444" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Weight" stroke="#6366f1" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="HR" stroke="#14b8a6" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              {vitals?.length === 0 && <EmptyState message="No vitals recorded" />}
              {vitals?.map((v) => {
                const bmi = calculateBMI(v.weight, v.height);
                const bmiCat = getBMICategory(bmi);
                const isHighTemp = v.temperature > 37.5;
                const isHighBP = v.systolic_bp > 140 || v.diastolic_bp > 90;
                return (
                  <div key={v.id} className="glass-card p-4">
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{formatDateTime(v.recorded_at)}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Temp</span><p className={`font-semibold ${isHighTemp ? 'text-red-500' : ''}`} style={!isHighTemp ? { color: 'var(--text-primary)' } : {}}>{v.temperature}°C</p></div>
                      <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>BP</span><p className={`font-semibold ${isHighBP ? 'text-red-500' : ''}`} style={!isHighBP ? { color: 'var(--text-primary)' } : {}}>{v.systolic_bp}/{v.diastolic_bp}</p></div>
                      <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>HR</span><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.heart_rate} bpm</p></div>
                      <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>SpO₂</span><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.oxygen_saturation}%</p></div>
                      <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Weight</span><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.weight} kg</p></div>
                      <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>BMI</span><p className={`font-semibold ${bmiCat.color}`}>{bmi} ({bmiCat.label})</p></div>
                      <div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>RR</span><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.respiratory_rate}/min</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="space-y-3">
            {cycles?.length === 0 && <EmptyState message="No medication records" />}
            {cycles?.map((cycle) => {
              const meds = store.cycle_medications.filter((cm) => cm.cycle_id === cycle.id);
              if (meds.length === 0) return null;
              return (
                <div key={cycle.id} className="glass-card p-5">
                  <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                    Treatment Cycle {cycle.cycle_number}
                  </h4>
                  <div className="space-y-2">
                    {meds.map((cm) => {
                      const med = store.medications.find((m) => m.id === cm.medication_id);
                      return (
                        <div key={cm.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{med?.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cm.dose} • {cm.frequency} • {cm.route}</p>
                          </div>
                          <StatusBadge status={med?.category || 'chemo'} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="space-y-3">
            {labResults?.length === 0 && <EmptyState message="No lab results" />}
            {labResults?.map((r) => {
              const test = store.lab_tests.find((t) => t.id === r.lab_test_id);
              const isAbnormal = r.status !== 'normal';
              return (
                <div key={r.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{test?.name}</h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(r.date)} • {r.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isAbnormal ? 'text-red-500' : ''}`} style={!isAbnormal ? { color: 'var(--accent-primary)' } : {}}>
                      {r.value} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{test?.unit}</span>
                    </p>
                    {test?.normal_range_min != null && (
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Normal: {test.normal_range_min}–{test.normal_range_max}
                      </p>
                    )}
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'imaging' && (
          <div className="space-y-3">
            {imaging?.length === 0 && <EmptyState message="No imaging reports" />}
            {imaging?.map((img) => (
              <div key={img.id} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-primary)' }}>{img.type}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{img.body_part} • {formatDate(img.date)}</span>
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}><strong>Findings:</strong> {img.findings}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}><strong>Impression:</strong> {img.impression}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Radiologist: {img.radiologist}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="space-y-3">
            {visits?.length === 0 && <EmptyState message="No visits recorded" />}
            {visits?.map((v) => {
              const doc = store.doctors.find((d) => d.id === v.doctor_id);
              const docUser = doc ? store.users.find((u) => u.id === doc.user_id) : null;
              return (
                <div key={v.id} className="glass-card p-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>{v.visit_type}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(v.visit_date)}</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{v.chief_complaint}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{v.notes}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Doctor: {docUser?.full_name}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-3">
            {contacts?.length === 0 && <EmptyState message="No emergency contacts" />}
            {contacts?.map((c) => (
              <div key={c.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</h4>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.relationship}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.phone}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.email}</p>
                  {c.is_primary && <span className="text-[10px] font-semibold text-emerald-500">PRIMARY</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card p-12 text-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}
