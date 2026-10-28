import { create } from 'zustand'

export interface Toast {
  id: number
  texto: string
  tipo: 'ok' | 'error'
}

interface ToastState {
  toasts: Toast[]
  mostrar: (texto: string, tipo?: Toast['tipo']) => void
  quitar: (id: number) => void
}

let contador = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  mostrar: (texto, tipo = 'ok') => {
    const id = ++contador
    set((s) => ({ toasts: [...s.toasts, { id, texto, tipo }] }))
    setTimeout(() => get().quitar(id), 4000)
  },
  quitar: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  ok: (texto: string) => useToastStore.getState().mostrar(texto, 'ok'),
  error: (texto: string) => useToastStore.getState().mostrar(texto, 'error'),
}
