import { router } from 'expo-router'
import type { ComponentProps, ReactNode } from 'react'
import type { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/Ui'
import { useAuthStore } from '../../store/auth'

interface Props {
  children: ReactNode
  titulo?: string
  texto?: string
  icono?: ComponentProps<typeof Ionicons>['name']
}

/** Muestra el contenido sólo con sesión iniciada; si no, invita a entrar. */
export function RequiereSesion({ children, titulo = 'Inicia sesión para continuar', texto, icono = 'lock-closed-outline' }: Props) {
  const autenticado = useAuthStore((s) => !!s.usuario)
  if (autenticado) return <>{children}</>
  return (
    <EmptyState
      icono={icono}
      titulo={titulo}
      texto={texto}
      accion={<Button onPress={() => router.push('/login')}>Iniciar sesión</Button>}
    />
  )
}
