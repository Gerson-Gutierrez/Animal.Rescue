import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { mensajesApi } from '../../api/endpoints'
import { ConfirmDialog } from '../../components/Modal'
import { Avatar, Cargando, EmptyState, ErrorState } from '../../components/Ui'
import { RequiereSesion } from '../../features/cuenta/RequiereSesion'
import { useConversaciones } from '../../features/mensajes/hooks'
import { formatHoraChat } from '../../lib/format'
import { colores } from '../../lib/theme'
import { toast } from '../../lib/toast'
import type { ConversacionResumen } from '../../types/api'

function ConversacionItem({ c, onEliminar }: { c: ConversacionResumen; onEliminar: () => void }) {
  const sinLeer = c.noLeidos > 0
  return (
    <View style={estilos.fila}>
      <Pressable
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id, nombre: c.otro.nombre } })}
        style={({ pressed }) => [estilos.contenido, pressed && { backgroundColor: '#fafaf9' }]}
      >
        <Avatar nombre={c.otro.nombre} fotoUrl={c.otro.fotoUrl} />
        <View style={{ flex: 1, gap: 1 }}>
          <View style={estilos.linea}>
            <Text style={[estilos.nombre, sinLeer && { fontWeight: '900' }]} numberOfLines={1}>{c.otro.nombre}</Text>
            {c.fechaUltimoMensaje && <Text style={estilos.hora}>{formatHoraChat(c.fechaUltimoMensaje)}</Text>}
          </View>
          {c.publicacionNombre && <Text style={estilos.sobre} numberOfLines={1}>Sobre {c.publicacionNombre}</Text>}
          <View style={estilos.linea}>
            <Text style={[estilos.ultimo, sinLeer && { color: colores.texto, fontWeight: '600' }]} numberOfLines={1}>
              {c.ultimoMensajeEsImagen ? '📷 Imagen' : c.ultimoMensaje}
            </Text>
            {sinLeer && (
              <View style={estilos.badge}>
                <Text style={estilos.badgeTexto}>{c.noLeidos}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
      <Pressable onPress={onEliminar} style={estilos.x} hitSlop={6} accessibilityLabel={`Eliminar conversación con ${c.otro.nombre}`}>
        <Ionicons name="close" size={22} color={colores.textoTenue} />
      </Pressable>
    </View>
  )
}

function Lista() {
  const queryClient = useQueryClient()
  const lista = useConversaciones()
  const [aEliminar, setAEliminar] = useState<ConversacionResumen | null>(null)

  const eliminar = useMutation({
    mutationFn: (id: string) => mensajesApi.eliminar(id),
    onSuccess: (_r, id) => {
      toast.ok('Conversación eliminada')
      setAEliminar(null)
      queryClient.removeQueries({ queryKey: ['mensajes', id] })
      void queryClient.invalidateQueries({ queryKey: ['conversaciones'] })
    },
  })

  return (
    <>
      <FlatList
        data={lista.data ?? []}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ConversacionItem c={item} onEliminar={() => setAEliminar(item)} />}
        ItemSeparatorComponent={() => <View style={estilos.separador} />}
        contentContainerStyle={{ flexGrow: 1 }}
        onRefresh={() => void lista.refetch()}
        refreshing={lista.isRefetching}
        ListEmptyComponent={
          lista.isPending ? <Cargando /> : lista.isError ? <ErrorState onReintentar={() => void lista.refetch()} /> : (
            <EmptyState icono="chatbubbles-outline" titulo="Sin conversaciones" texto="Cuando contactes al autor de una publicación, el chat aparecerá aquí." />
          )
        }
      />
      <ConfirmDialog
        abierto={!!aEliminar}
        titulo="Eliminar conversación"
        mensaje={`Se eliminará toda la conversación con ${aEliminar?.otro.nombre ?? ''} de tu lista. ¿Continuar?`}
        cargando={eliminar.isPending}
        onSi={() => aEliminar && eliminar.mutate(aEliminar.id)}
        onNo={() => setAEliminar(null)}
      />
    </>
  )
}

export default function MensajesScreen() {
  return (
    <RequiereSesion icono="chatbubbles-outline" titulo="Inicia sesión para ver tus mensajes">
      <Lista />
    </RequiereSesion>
  )
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: colores.tarjeta },
  contenido: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 16 },
  linea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nombre: { fontSize: 16, fontWeight: '700', color: colores.texto, flex: 1 },
  hora: { fontSize: 12, color: colores.textoTenue },
  sobre: { fontSize: 12, fontWeight: '600', color: colores.marcaOscuro },
  ultimo: { fontSize: 14, color: colores.textoTenue, flex: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colores.marca, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeTexto: { color: '#fff', fontSize: 12, fontWeight: '800' },
  x: { width: 52, alignItems: 'center', justifyContent: 'center' },
  separador: { height: StyleSheet.hairlineWidth, backgroundColor: colores.borde, marginLeft: 72 },
})
