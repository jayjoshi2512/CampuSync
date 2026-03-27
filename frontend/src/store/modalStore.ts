import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  type: 'confirm' | 'prompt';
  title: string;
  message: string;
  defaultValue?: string;
  resolve: ((value: any) => void) | null;
  openConfirm: (title: string, message: string) => Promise<boolean>;
  openPrompt: (title: string, message: string, defaultVal?: string) => Promise<string | null>;
  close: (value?: any) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  type: 'confirm',
  title: '',
  message: '',
  defaultValue: '',
  resolve: null,
  openConfirm: (title, message) => new Promise((resolve) => {
    set({ isOpen: true, type: 'confirm', title, message, resolve });
  }),
  openPrompt: (title, message, defaultValue = '') => new Promise((resolve) => {
    set({ isOpen: true, type: 'prompt', title, message, defaultValue, resolve });
  }),
  close: (value) => {
    const { resolve } = get();
    if (resolve) resolve(value);
    set({ isOpen: false, resolve: null });
  }
}));
