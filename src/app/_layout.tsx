import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Toaster } from '../components/Ui'
import { useChatRealtime } from '../features/mensajes/hooks'
import { queryClient } from '../lib/queryClient'
import { colores } from '../lib/theme'
import { useAuthStore } from '../store/auth'

SplashScreen.preventAutoHideAsync()

function TiempoReal() {
  useChatRealtime()
  return null
}

export default function RootLayout() {
  // Se espera a leer la sesión guardada antes de mostrar pantallas.
  const [sesionCargada, setSesionCargada] = useState(() => useAuthStore.persist.hasHydrated())
  useEffect(() => {
    const quitar = useAuthStore.persist.onFinishHydration(() => setSesionCargada(true))
    // Por si terminó de leerse entre el primer render y la suscripción.
    if (useAuthStore.persist.hasHydrated()) queueMicrotask(() => setSesionCargada(true))
    return quitar
  }, [])
  useEffect(() => {
    if (sesionCargada) void SplashScreen.hideAsync()
  }, [sesionCargada])

  if (!sesionCargada) return null

  return (
    <QueryClientProvider client={queryClient}>
      <TiempoReal />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colores.marcaOscuro,
          headerTitleStyle: { fontWeight: '800', color: colores.texto },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="publicacion/[id]/index" options={{ title: 'Publicación' }} />
        <Stack.Screen name="publicacion/[id]/editar" options={{ title: 'Editar publicación' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Conversación' }} />
        <Stack.Screen name="mis-mascotas" options={{ title: 'Mis mascotas' }} />
        <Stack.Screen name="cuenta" options={{ title: 'Mi cuenta' }} />
        <Stack.Screen name="admin/reportes" options={{ title: 'Reportes' }} />
        <Stack.Screen name="admin/publicaciones" options={{ title: 'Publicaciones' }} />
        <Stack.Screen name="admin/administradores" options={{ title: 'Administradores' }} />
      </Stack>
      <Toaster />
    </QueryClientProvider>
  )
}
