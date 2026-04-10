import useUIStore from '../../store/uiStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();
  return (
    <button onClick={toggleTheme} className="px-3 py-2 rounded-xl border">
      Theme: {theme}
    </button>
  );
}