import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// tiny toast store - just enough so any page can say "order placed".
// kept in context because header + pages both need it. nothing more global.
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, severity = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((old) => [...old, { id, message, severity }]);
    // auto dismiss, no need to keep pile of snackbars
    setTimeout(() => {
      setToasts((old) => old.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ toasts, push }), [toasts, push]);

  return <ToastCtx.Provider value={value}>{children}</ToastCtx.Provider>;
}

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};
