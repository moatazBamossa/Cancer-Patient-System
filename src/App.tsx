import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageSkeleton } from './components/ui/Skeleton';

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
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));

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
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Workspace Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
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
                  <Route path="/profile" element={<ProfilePage />} />
                  
                  {/* Default redirect within AppLayout */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
