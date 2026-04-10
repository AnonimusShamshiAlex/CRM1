import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/clients/ClientsPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import TasksPage from './pages/tasks/TasksPage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import FinancePage from './pages/finance/FinancePage';
import TeamPage from './pages/team/TeamPage';
import PipelinesPage from './pages/pipelines/PipelinesPage';
import PipelineEditorPage from './pages/pipelines/PipelineEditorPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import ManagersRatingPage from './pages/manager/ManagersRatingPage';
import ClientFieldsPage from './pages/settings/ClientFieldsPage';

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px' },
        }}
      />
      <Routes>
        {/* Гостевые маршруты */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Защищённые маршруты */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="team" element={<TeamPage />} />
          {/* Воронки продаж */}
          <Route path="pipelines" element={<PipelinesPage />} />
          <Route path="pipelines/:id/edit" element={<PipelineEditorPage />} />
          {/* Личный кабинет менеджера */}
          <Route path="manager/dashboard" element={<ManagerDashboardPage />} />
          <Route path="managers/rating" element={<ManagersRatingPage />} />
          {/* Настройки */}
          <Route path="settings/client-fields" element={<ClientFieldsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
