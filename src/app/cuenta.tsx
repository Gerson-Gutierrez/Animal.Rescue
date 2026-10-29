import { Ionicons } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Redirect, router, type Href } from 'expo-router'
import type { ComponentProps } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../components/Texto'
import { z } from 'zod'
import { cuentaApi } from '../api/endpoints'
import { mensajeError } from '../api/http'
import { Button } from '../components/Button'
import { Seccion, TextField } from '../components/Fields'
import { Avatar, Badge } from '../components/Ui'
import { API_URL } from '../lib/config'
import { colores, radio } from '../lib/theme'
import { toast } from '../lib/toast'
import { useAuthStore, useRol } from '../store/auth'
import type { Rol } from '../types/api'

const ETIQUETA_ROL: Record<Rol, string> = { USUARIO: 'Usuario', ADMIN: 'Administrador', SUPERADMIN: 'Superadministrador' }
const schema = z.object({ nombre: z.string().trim().min(1, 'Ingresa tu nombre').max(100) })

function Acceso({ href, icono, texto }: { href: Href; icono: ComponentProps<typeof Ionicons>['name']; texto: string }) {
  return (
    <Pressable onPress={() => router.push(href)} style={({ pressed }) => [estilos.acceso, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icono} size={22} color={colores.marca} />
      <Text style={estilos.accesoTexto}>{texto}</Text>
      <Ionicons name="chevron-forward" size={20} color={colores.textoTenue} />
    </Pressable>
  )
}

export default function CuentaScreen() {
  const queryClient = useQueryClient()
  const { usuario, refreshToken, setUsuario, cerrarSesion } = useAuthStore()
  const { esAdmin, esSuperAdmin } = useRol()
  const { control, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: usuario?.nombre ?? '' },
  })

  const actualizar = useMutation({
    mutationFn: cuentaApi.actualizarPerfil,
    onSuccess: (u) => {
      setUsuario(u)
      toast.ok('Perfil actualizado')
    },
    onError: (e) => toast.error(mensajeError(e)),
  })

  const salir = async () => {
    if (refreshToken) await cuentaApi.logout(refreshToken).catch(() => undefined)
    cerrarSesion()
    queryClient.clear()
    router.replace('/')
  }

  if (!usuario) return <Redirect href="/login" />

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={estilos.perfil}>
        <Avatar nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} tam={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={estilos.nombre} numberOfLines={1}>{usuario.nombre}</Text>
          <Text style={estilos.email} numberOfLines={1}>{usuario.email}</Text>
          <Badge color={usuario.rol === 'USUARIO' ? 'stone' : 'orange'}>{ETIQUETA_ROL[usuario.rol]}</Badge>
        </View>
      </View>

      <Seccion>
        <Controller
          control={control}
          name="nombre"
          render={({ field }) => <TextField etiqueta="Nombre" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.nombre?.message} />}
        />
        <Button deshabilitado={!isDirty} cargando={actualizar.isPending} onPress={handleSubmit((d) => actualizar.mutate(d.nombre))}>
          Guardar cambios
        </Button>
      </Seccion>

      <View style={{ gap: 8 }}>
        <Acceso href="/mis-mascotas" icono="paw" texto="Mis mascotas" />
        {esAdmin && <Acceso href="/admin/reportes" icono="flag" texto="Reportes de publicaciones" />}
        {esAdmin && <Acceso href="/admin/publicaciones" icono="search" texto="Inspeccionar publicaciones" />}
        {esSuperAdmin && <Acceso href="/admin/administradores" icono="people" texto="Administradores" />}
      </View>

      <Button variante="secundario" icono="log-out-outline" onPress={salir}>
        Cerrar sesión
      </Button>
      <Text style={estilos.servidor}>Servidor: {API_URL}</Text>
    </ScrollView>
  )
}

const estilos = StyleSheet.create({
  perfil: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: 16 },
  nombre: { fontSize: 19, fontWeight: '800', color: colores.texto },
  email: { fontSize: 14, color: colores.textoTenue },
  acceso: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, backgroundColor: colores.tarjeta, borderRadius: radio.md, paddingHorizontal: 16 },
  accesoTexto: { flex: 1, fontSize: 16, fontWeight: '600', color: colores.texto },
  servidor: { fontSize: 11, color: colores.textoTenue, textAlign: 'center' },
})
