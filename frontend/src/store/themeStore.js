import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', next);
          return { theme: next };
        }),
      initTheme: () =>
        set((state) => {
          document.documentElement.setAttribute('data-theme', state.theme);
          return {};
        }),
    }),
    { name: 'crm-theme' }
  )
);

export default useThemeStore;
