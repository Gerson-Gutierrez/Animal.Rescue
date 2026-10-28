import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, router } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, ScrollView, Text } from 'react-native'
import { z } from 'zod'
import { cuentaApi } from '../api/endpoints'
import { mensajeError } from '../api/http'
import { Button } from '../components/Button'
import { TextField } from '../components/Fields'
import { estilos, Marca } from '../features/cuenta/Marca'
import { toast } from '../lib/toast'
import { useAuthStore } from '../store/auth'

const schema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu correo').email('Correo no válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export default function LoginScreen() {
  const alturaCabecera = useHeaderHeight()
  const queryClient = useQueryClient()
  const setSesion = useAuthStore((s) => s.setSesion)
  const { control, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const login = useMutation({
    mutationFn: cuentaApi.login,
    onSuccess: (r) => {
      queryClient.clear()
      setSesion(r)
      if (router.canGoBack()) router.back()
      else router.replace('/')
    },
    onError: (e) => toast.error(mensajeError(e)),
  })

  return (
    // En Android (edge-to-edge) la ventana no se redimensiona con el teclado, así que se usa padding en ambas plataformas.
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={alturaCabecera}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Marca />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              etiqueta="Correo electrónico"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              etiqueta="Contraseña"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="current-password"
              error={errors.password?.message}
              onSubmitEditing={() => void handleSubmit((d) => login.mutate(d))()}
            />
          )}
        />
        <Button cargando={login.isPending} onPress={handleSubmit((d) => login.mutate(d))}>
          Iniciar sesión
        </Button>
        <Text style={estilos.pie}>
          ¿No tienes cuenta?{' '}
          <Link href="/registro" replace style={estilos.enlace}>
            Regístrate
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
