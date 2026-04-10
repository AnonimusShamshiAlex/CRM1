import { Link } from 'react-router-dom';
import { canViewFinance, canViewMarketingDashboard } from '../../utils/roles';

export default function RoleBasedSidebar({ role }) {
  const items = [
    { name: 'Dashboard', to: '/' },
    { name: 'Pipelines', to: '/pipelines' },
    { name: 'Tasks', to: '/tasks' },
    { name: 'Projects', to: '/projects' },
    ...(canViewMarketingDashboard(role) ? [{ name: 'Analytics', to: '/marketing/dashboard' }] : []),
    ...(canViewFinance(role) ? [{ name: 'Finance', to: '/finance' }] : []),
    ...(role === 'client' ? [{ name: 'Client Portal', to: '/client-portal' }] : []),
  ];

  return (
    <aside className="w-64 border-r min-h-screen p-4">
      <div className="font-bold text-xl mb-6">Agency CRM</div>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}