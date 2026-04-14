import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 минут неактивности
const WARNING_MS = 2 * 60 * 1000;  // предупреждение за 2 минуты

export function useSessionTimeout() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const timerRef = useRef(null);
  const warningRef = useRef(null);
  const warningShownRef = useRef(false);

  const doLogout = useCallback(() => {
    logout();
    navigate('/login?reason=timeout');
  }, [logout, navigate]);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(warningRef.current);
    warningShownRef.current = false;

    if (!token) return;

    // Предупреждение за 2 минуты до выхода
    warningRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        const stay = window.confirm(
          'Вы неактивны уже 28 минут.\nНажмите OK чтобы остаться в системе, или Cancel для выхода.'
        );
        if (stay) {
          resetTimer();
        } else {
          doLogout();
        }
      }
    }, TIMEOUT_MS - WARNING_MS);

    // Автовыход
    timerRef.current = setTimeout(doLogout, TIMEOUT_MS);
  }, [token, doLogout]);

  useEffect(() => {
    if (!token) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => resetTimer();

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimeout(timerRef.current);
      clearTimeout(warningRef.current);
    };
  }, [token, resetTimer]);
}
