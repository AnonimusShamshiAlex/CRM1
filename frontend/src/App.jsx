import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useThemeStore from './store/themeStore';
import useAuthStore from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import './styles/theme.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ClientsPage from './pages/clients/ClientsPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import ClientForm from './pages/clients/ClientForm';
import ClientImportPage from './pages/clients/ClientImportPage';
import LeadDistributionPage from './pages/clients/LeadDistributionPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectForm from './pages/projects/ProjectForm';
import TasksPage from './pages/tasks/TasksPage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import FinancePage from './pages/finance/FinancePage';
import InvoiceForm from './pages/finance/InvoiceForm';
import ExpenseForm from './pages/finance/ExpenseForm';
import TeamPage from './pages/team/TeamPage';
import PipelinesPage from './pages/pipelines/PipelinesPage';
import PipelineEditorPage from './pages/pipelines/PipelineEditorPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import ManagersRatingPage from './pages/manager/ManagersRatingPage';
import DocumentConstructorPage from './pages/documents/DocumentConstructorPage';
import ClientFieldsPage from './pages/settings/ClientFieldsPage';
import ActivityLogPage from './pages/settings/ActivityLogPage';
import WebhookSettingsPage from './pages/settings/WebhookSettingsPage';

const ADMIN = ['superadmin', 'admin'];
const ADMIN_ROP = ['superadmin', 'admin', 'rop'];

function Guard({ children, roles }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.status === 'pending') return <Navigate to="/register?pending=true" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { initTheme } = useThemeStore();
  useEffect(() => {
    initTheme();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Guard><AppLayout /></Guard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/import" element={<Guard roles={ADMIN_ROP}><ClientImportPage /></Guard>} />
          <Route path="clients/distribute" element={<Guard roles={ADMIN_ROP}><LeadDistributionPage /></Guard>} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="clients/:id/edit" element={<ClientForm />} />

          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={<Guard roles={ADMIN_ROP}><ProjectForm /></Guard>} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/edit" element={<Guard roles={ADMIN_ROP}><ProjectForm /></Guard>} />

          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />

          <Route path="finance" element={<Guard roles={ADMIN_ROP}><FinancePage /></Guard>} />
          <Route path="finance/invoice/new" element={<Guard roles={ADMIN_ROP}><InvoiceForm /></Guard>} />
          <Route path="finance/expense/new" element={<Guard roles={ADMIN_ROP}><ExpenseForm /></Guard>} />

          <Route path="team" element={<Guard roles={ADMIN}><TeamPage /></Guard>} />

          <Route path="pipelines" element={<Guard roles={ADMIN_ROP}><PipelinesPage /></Guard>} />
          <Route path="pipelines/:id/edit" element={<Guard roles={ADMIN_ROP}><PipelineEditorPage /></Guard>} />

          <Route path="managers/dashboard" element={<ManagerDashboardPage />} />
          <Route path="managers/rating" element={<Guard roles={ADMIN_ROP}><ManagersRatingPage /></Guard>} />

          <Route path="documents" element={<DocumentConstructorPage />} />

          <Route path="activity-log" element={<Guard roles={ADMIN}><ActivityLogPage /></Guard>} />
          <Route path="settings" element={<Guard roles={ADMIN}><ClientFieldsPage /></Guard>} />
          <Route path="settings/webhooks" element={<Guard roles={ADMIN}><WebhookSettingsPage /></Guard>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
