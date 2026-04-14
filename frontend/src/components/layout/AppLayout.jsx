import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

export default function AppLayout() {
  // ТЗ: Session Control — автовыход при неактивности
  useSessionTimeout();

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
    }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
