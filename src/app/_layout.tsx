import { QueryClientProvider } from '@tanstack/react-query'
import { Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold, useFonts } from '@expo-google-fonts/fredoka'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { FondoPatitas } from '../components/FondoPatitas'
import { estiloFuente } from '../components/Texto'
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
  // Si la fuente falla se sigue con la del sistema en vez de dejar la app en blanco.
  const [fuenteCargada, errorFuente] = useFonts({ Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold })
  const listo = sesionCargada && (fuenteCargada || errorFuente != null)
  useEffect(() => {
    if (listo) void SplashScreen.hideAsync()
  }, [listo])

  if (!listo) return null

  return (
    <QueryClientProvider client={queryClient}>
      <TiempoReal />
      <StatusBar style="dark" />
      <Stack
        // Las pestañas ponen su propio fondo (ver (tabs)/_layout.tsx).
        screenLayout={({ route, children }) => (route.name === '(tabs)' ? children : <FondoPatitas>{children}</FondoPatitas>)}
        screenOptions={{
          headerTintColor: colores.marcaOscuro,
          headerTitleStyle: { ...estiloFuente('700'), color: colores.texto },
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
