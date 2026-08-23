import React from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  icon?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item">
          {toast.icon && <span>{toast.icon}</span>}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
};
