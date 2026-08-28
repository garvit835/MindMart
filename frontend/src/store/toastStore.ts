import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'info',
  showToast: (message, type = 'info') => {
    // Clear any existing timeout to prevent premature dismissal
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    set({ visible: true, message, type });
    // Auto-dismiss toast after 4 seconds
    toastTimeoutId = setTimeout(() => {
      set({ visible: false });
      toastTimeoutId = null;
    }, 4000);
  },
  hideToast: () => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
      toastTimeoutId = null;
    }
    set({ visible: false });
  },
}));
