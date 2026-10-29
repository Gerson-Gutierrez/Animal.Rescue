import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthResponse, Rol, Usuario } from '../types/api'

interface AuthState {
  usuario: Usuario | null
  accessToken: string | null
  refreshToken: string | null
  setSesion: (r: AuthResponse) => void
  setUsuario: (u: Usuario) => void
  cerrarSesion: () => void
}

// Los tokens se guardan cifrados en el llavero del teléfono; en la versión web (sin llavero), en localStorage.
const almacenSeguro = createJSONStorage(() =>
  Platform.OS === 'web'
    ? localStorage
    : {
        getItem: (k: string) => SecureStore.getItemAsync(k),
        setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
        removeItem: (k: string) => SecureStore.deleteItemAsync(k),
      },
)

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      setSesion: (r) => set({ usuario: r.usuario, accessToken: r.accessToken, refreshToken: r.refreshToken }),
      setUsuario: (usuario) => set({ usuario }),
      cerrarSesion: () => set({ usuario: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'animal-rescue-auth', storage: almacenSeguro },
  ),
)

export function useRol() {
  const rol: Rol | null = useAuthStore((s) => s.usuario?.rol ?? null)
  return {
    rol,
    autenticado: rol !== null,
    esAdmin: rol === 'ADMIN' || rol === 'SUPERADMIN',
    esSuperAdmin: rol === 'SUPERADMIN',
  }
}
