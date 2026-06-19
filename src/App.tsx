import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const AppLayout = lazy(() => import('./components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ModuleGuard } from './components/guards';

// Lazy load features
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const PatientsPage = lazy(() => import('./features/patients/PatientsPage'));
const PatientDetailsPage = lazy(() => import('./features/patients/PatientDetailsPage'));
const PatientVisitsLanding = lazy(() => import('./pages/PatientVisitsLanding'));
const PatientVisitsPage = lazy(() => import('./pages/PatientVisitsPage'));
const DiagnosesPage = lazy(() => import('./features/diagnoses/DiagnosesPage'));
const CancerTypesPage = lazy(() => import('./features/cancer/CancerTypesPage'));
const TreatmentPlansPage = lazy(() => import('./features/treatment/TreatmentPlansPage'));
const VitalsPage = lazy(() => import('./features/vitals/VitalsPage'));
const MedicationsPage = lazy(() => import('./features/medications/MedicationsPage'));
const LabTestsPage = lazy(() => import('./features/lab/LabTestsPage'));
const ManageLabTestsPage = lazy(() => import('./features/lab/ManageLabTestsPage'));
const ImagingPage = lazy(() => import('./features/imaging/ImagingPage'));
const DoctorsPage = lazy(() => import('./features/doctors/DoctorsPage'));
const ClinicsPage = lazy(() => import('./features/doctors/ClinicsPage'));
const VisitsPage = lazy(() => import('./features/doctors/VisitsPage'));
const RolesPage = lazy(() => import('./features/roles/RolesPage'));
const AddUsersPage = lazy(() => import('./features/users/AddUsersPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const UpcomingVisitsPage = lazy(() => import('./features/doctors/UpcomingVisitsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function PatientVisitsRoute() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  return patientId > 0 ? <PatientVisitsPage patientId={patientId} /> : <Navigate to="/patients" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}><LoginPage /></Suspense>} />

              {/* Protected Workspace Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Suspense fallback={<div className="h-screen flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/10"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}><AppLayout /></Suspense>}>
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/patients" element={<ModuleGuard module="patient"><PatientsPage /></ModuleGuard>} />
                  <Route path="/patient-visits" element={<ModuleGuard module="patient_visits"><PatientVisitsLanding /></ModuleGuard>} />
                  <Route path="/patients/:id" element={<ModuleGuard module="patient"><PatientDetailsPage /></ModuleGuard>} />
                  <Route path="/patients/:id/visits" element={<ModuleGuard module="patient_visits"><PatientVisitsRoute /></ModuleGuard>} />
                  <Route path="/diagnoses" element={<ModuleGuard module="diagnoses"><DiagnosesPage /></ModuleGuard>} />
                  <Route path="/cancer-types" element={<ModuleGuard module="cancer_types"><CancerTypesPage /></ModuleGuard>} />
                  <Route path="/treatment-plans" element={<ModuleGuard module="treatment_plans"><TreatmentPlansPage /></ModuleGuard>} />
                  <Route path="/vitals" element={<ModuleGuard module="clinic_visits_and_vitals"><VitalsPage /></ModuleGuard>} />
                  <Route path="/medications" element={<ModuleGuard module="medications"><MedicationsPage /></ModuleGuard>} />
                  <Route path="/lab-tests" element={<ModuleGuard module="laboratory_tests"><LabTestsPage /></ModuleGuard>} />
                  <Route path="/lab-tests/manage" element={<ModuleGuard module="laboratory_tests"><ManageLabTestsPage /></ModuleGuard>} />
                  <Route path="/imaging" element={<ModuleGuard module="imaging_reports"><ImagingPage /></ModuleGuard>} />
                  <Route path="/doctors" element={<ModuleGuard module="doctor"><DoctorsPage /></ModuleGuard>} />
                  <Route path="/clinics" element={<ModuleGuard module="clinics"><ClinicsPage /></ModuleGuard>} />
                  <Route path="/visits" element={<ModuleGuard module="visits"><VisitsPage /></ModuleGuard>} />
                  <Route path="/roles" element={<ModuleGuard module="roles"><RolesPage /></ModuleGuard>} />
                  <Route path="/users" element={<ModuleGuard module="user_management"><AddUsersPage /></ModuleGuard>} />
                  <Route path="/users/add" element={<Navigate to="/users" replace />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/upcoming-visits" element={<ModuleGuard module="visits"><UpcomingVisitsPage /></ModuleGuard>} />

                  {/* Default redirect within AppLayout */}
                  <Route path="/" element={<Navigate to="/welcome" replace />} />
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </ErrorBoundary>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
