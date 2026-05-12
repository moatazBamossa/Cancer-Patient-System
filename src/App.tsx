import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const AppLayout = lazy(() => import('./components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy load features
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const PatientsPage = lazy(() => import('./features/patients/PatientsPage'));
const PatientDetailsPage = lazy(() => import('./features/patients/PatientDetailsPage'));
const DiagnosesPage = lazy(() => import('./features/diagnoses/DiagnosesPage'));
const CancerTypesPage = lazy(() => import('./features/cancer/CancerTypesPage'));
const TreatmentPlansPage = lazy(() => import('./features/treatment/TreatmentPlansPage'));
const VitalsPage = lazy(() => import('./features/vitals/VitalsPage'));
const MedicationsPage = lazy(() => import('./features/medications/MedicationsPage'));
const LabTestsPage = lazy(() => import('./features/lab/LabTestsPage'));
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
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/patients" element={<PatientsPage />} />
                  <Route path="/patients/:id" element={<PatientDetailsPage />} />
                  <Route path="/diagnoses" element={<DiagnosesPage />} />
                  <Route path="/cancer-types" element={<CancerTypesPage />} />
                  <Route path="/treatment-plans" element={<TreatmentPlansPage />} />
                  <Route path="/vitals" element={<VitalsPage />} />
                  <Route path="/medications" element={<MedicationsPage />} />
                  <Route path="/lab-tests" element={<LabTestsPage />} />
                  <Route path="/imaging" element={<ImagingPage />} />
                  <Route path="/doctors" element={<DoctorsPage />} />
                  <Route path="/clinics" element={<ClinicsPage />} />
                  <Route path="/visits" element={<VisitsPage />} />
                  <Route path="/roles" element={<RolesPage />} />
                  <Route path="/users/add" element={<AddUsersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/upcoming-visits" element={<UpcomingVisitsPage />} />
                  
                  {/* Default redirect within AppLayout */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
