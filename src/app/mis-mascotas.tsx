import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../components/Texto'
import { publicacionesApi } from '../api/endpoints'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/Modal'
import { Badge, Cargando, EmptyState, ErrorState } from '../components/Ui'
import { mediaUrl } from '../lib/config'
import { formatFecha } from '../lib/format'
import { anchoMaximo, centrado, colores, radio, sombra } from '../lib/theme'
import { toast } from '../lib/toast'
import { useAuthStore } from '../store/auth'
import type { PublicacionCard } from '../types/api'

/** Miniatura vertical con las acciones de editar y eliminar. */
function MiPublicacion({ p, onEliminar }: { p: PublicacionCard; onEliminar: () => void }) {
  const src = mediaUrl(p.imagenUrl)
  return (
    <View style={estilos.item}>
      <Pressable onPress={() => router.push(`/publicacion/${p.id}`)} style={estilos.foto}>
        {src ? <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="image-outline" size={24} color={colores.borde} />}
      </Pressable>
      <View style={{ flex: 1, gap: 3 }}>
        <Pressable onPress={() => router.push(`/publicacion/${p.id}`)} style={{ gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={estilos.nombre} numberOfLines={1}>{p.nombreMascota}</Text>
            {p.estado === 'ENCONTRADA' && <Badge color="green">Encontrada</Badge>}
          </View>
          <Text style={estilos.dato} numberOfLines={1}>{p.ubicacionTexto}</Text>
          <Text style={estilos.dato}>{formatFecha(p.fechaPerdida)}</Text>
        </Pressable>
        <View style={estilos.acciones}>
          <Button compacto variante="secundario" icono="create-outline" style={{ flex: 1 }} onPress={() => router.push(`/publicacion/${p.id}/editar`)}>
            Editar
          </Button>
          <Button compacto variante="secundario" icono="trash-outline" style={{ flex: 1 }} onPress={onEliminar}>
            Eliminar
          </Button>
        </View>
      </View>
    </View>
  )
}

export default function MisMascotasScreen() {
  const queryClient = useQueryClient()
  const autenticado = useAuthStore((s) => !!s.usuario)
  const [aEliminar, setAEliminar] = useState<PublicacionCard | null>(null)
  const mias = useQuery({ queryKey: ['mias'], queryFn: publicacionesApi.mias, enabled: autenticado })

  const eliminar = useMutation({
    mutationFn: (id: string) => publicacionesApi.eliminar(id),
    onSuccess: () => {
      toast.ok('Publicación eliminada')
      setAEliminar(null)
      void queryClient.invalidateQueries({ queryKey: ['mias'] })
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
      void queryClient.invalidateQueries({ queryKey: ['mapa'] })
    },
  })

  if (!autenticado) return <Redirect href="/login" />

  return (
    <>
      <FlatList
        data={mias.data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, gap: 12, flexGrow: 1, ...centrado(anchoMaximo.contenido) }}
        renderItem={({ item }) => <MiPublicacion p={item} onEliminar={() => setAEliminar(item)} />}
        onRefresh={() => void mias.refetch()}
        refreshing={mias.isRefetching}
        ListEmptyComponent={
          mias.isPending ? <Cargando /> : mias.isError ? <ErrorState onReintentar={() => void mias.refetch()} /> : (
            <EmptyState
              icono="paw-outline"
              titulo="No has publicado mascotas"
              texto="Si tu mascota se perdió, publícala para que la comunidad te ayude."
              accion={<Button icono="add" onPress={() => router.push('/publicar')}>Publicar</Button>}
            />
          )
        }
      />
      <ConfirmDialog
        abierto={!!aEliminar}
        titulo="Eliminar publicación"
        mensaje={`¿Seguro que quieres eliminar la publicación de ${aEliminar?.nombreMascota ?? ''}? Esta acción no se puede deshacer.`}
        cargando={eliminar.isPending}
        onSi={() => aEliminar && eliminar.mutate(aEliminar.id)}
        onNo={() => setAEliminar(null)}
      />
    </>
  )
}

const estilos = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: 12, ...sombra },
  foto: { width: 96, height: 96, borderRadius: radio.md, overflow: 'hidden', backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 16, fontWeight: '800', color: colores.texto, flexShrink: 1 },
  dato: { fontSize: 13, color: colores.textoTenue },
  acciones: { flexDirection: 'row', gap: 8, marginTop: 'auto', paddingTop: 6 },
})
