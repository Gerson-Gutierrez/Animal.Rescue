import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from '../../components/Texto'
import { adminApi } from '../../api/endpoints'
import { Button } from '../../components/Button'
import { Badge, Cargando, ErrorState } from '../../components/Ui'
import { Buscador, SoloAdmin } from '../../features/admin/Comun'
import { colores, radio } from '../../lib/theme'
import { toast } from '../../lib/toast'
import { useDebounce } from '../../lib/useDebounce'
import type { Rol, UsuarioAdmin } from '../../types/api'

const ETIQUETA_ROL: Record<Rol, string> = { USUARIO: 'Usuario', ADMIN: 'Administrador', SUPERADMIN: 'Superadministrador' }

function Administradores() {
  const queryClient = useQueryClient()
  const [texto, setTexto] = useState('')
  const q = useDebounce(texto.trim(), 400)
  const usuarios = useQuery({ queryKey: ['admin', 'usuarios', q], queryFn: () => adminApi.usuarios(q) })

  const cambiar = useMutation({
    mutationFn: ({ u, rol }: { u: UsuarioAdmin; rol: 'USUARIO' | 'ADMIN' }) => adminApi.cambiarRol(u.id, rol),
    onSuccess: (u) => {
      toast.ok(u.rol === 'ADMIN' ? `${u.nombre} ahora es administrador` : `${u.nombre} ya no es administrador`)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] })
    },
  })

  return (
    <FlatList
      data={usuarios.data?.items ?? []}
      keyExtractor={(u) => u.id}
      contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<Buscador valor={texto} onCambio={setTexto} placeholder="Buscar usuario por nombre o correo" />}
      renderItem={({ item: u }) => {
        const cargando = cambiar.isPending && cambiar.variables?.u.id === u.id
        return (
          <View style={estilos.item}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={estilos.nombre} numberOfLines={1}>{u.nombre}</Text>
              <Text style={estilos.email} numberOfLines={1}>{u.email}</Text>
              <Badge color={u.rol === 'USUARIO' ? 'stone' : 'orange'}>{ETIQUETA_ROL[u.rol]}</Badge>
            </View>
            {u.rol === 'USUARIO' && (
              <Button compacto cargando={cargando} onPress={() => cambiar.mutate({ u, rol: 'ADMIN' })}>Hacer admin</Button>
            )}
            {u.rol === 'ADMIN' && (
              <Button compacto variante="secundario" cargando={cargando} onPress={() => cambiar.mutate({ u, rol: 'USUARIO' })}>Quitar admin</Button>
            )}
          </View>
        )
      }}
      ListEmptyComponent={usuarios.isPending ? <Cargando /> : usuarios.isError ? <ErrorState onReintentar={() => void usuarios.refetch()} /> : undefined}
    />
  )
}

export default function AdministradoresScreen() {
  return (
    <SoloAdmin superAdmin>
      <Administradores />
    </SoloAdmin>
  )
}

const estilos = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: 12 },
  nombre: { fontSize: 16, fontWeight: '700', color: colores.texto },
  email: { fontSize: 13, color: colores.textoTenue },
})
