import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, router } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, ScrollView } from 'react-native'
import { Text } from '../components/Texto'
import { z } from 'zod'
import { cuentaApi } from '../api/endpoints'
import { mensajeError } from '../api/http'
import { Button } from '../components/Button'
import { TextField } from '../components/Fields'
import { toast } from '../lib/toast'
import { useAuthStore } from '../store/auth'
import { estilos, Marca } from '../features/cuenta/Marca'

const schema = z.object({
  nombre: z.string().trim().min(1, 'Ingresa tu nombre').max(100),
  email: z.string().trim().min(1, 'Ingresa tu correo').email('Correo no válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
})

export default function RegistroScreen() {
  const alturaCabecera = useHeaderHeight()
  const queryClient = useQueryClient()
  const setSesion = useAuthStore((s) => s.setSesion)
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', email: '', password: '' },
  })

  const registro = useMutation({
    mutationFn: cuentaApi.registro,
    onSuccess: (r) => {
      queryClient.clear()
      setSesion(r)
      toast.ok(`¡Bienvenido/a, ${r.usuario.nombre}!`)
      if (router.canGoBack()) router.back()
      else router.replace('/')
    },
    onError: (e) => toast.error(mensajeError(e)),
  })

  const enviar = handleSubmit((d) => registro.mutate(d))

  return (
    // En Android (edge-to-edge) la ventana no se redimensiona con el teclado, así que se usa padding en ambas plataformas.
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={alturaCabecera}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Marca />
        <Controller
          control={control}
          name="nombre"
          render={({ field }) => (
            <TextField etiqueta="Nombre" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoComplete="name" error={errors.nombre?.message} />
          )}
        />
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
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres."
              error={errors.password?.message}
              onSubmitEditing={() => void enviar()}
            />
          )}
        />
        <Button cargando={registro.isPending} onPress={enviar}>
          Crear cuenta
        </Button>
        <Text style={estilos.pie}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" replace style={estilos.enlace}>
            Inicia sesión
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
