import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from '../../components/Texto'
import { adminApi } from '../../api/endpoints'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/Modal'
import { Badge, Cargando, EmptyState, ErrorState, Segmentado } from '../../components/Ui'
import { Buscador, Miniatura, SoloAdmin } from '../../features/admin/Comun'
import { anchoMaximo, centrado, colores, radio, sombra } from '../../lib/theme'
import { toast } from '../../lib/toast'
import { useDebounce } from '../../lib/useDebounce'
import type { AdminPublicacion, EstadoPublicacion } from '../../types/api'

type Filtro = EstadoPublicacion | 'TODAS'

function Publicaciones() {
  const queryClient = useQueryClient()
  const [texto, setTexto] = useState('')
  const q = useDebounce(texto.trim(), 400)
  const [estado, setEstado] = useState<Filtro>('TODAS')
  const [aEliminar, setAEliminar] = useState<AdminPublicacion | null>(null)

  const lista = useQuery({
    queryKey: ['admin', 'publicaciones', q, estado],
    queryFn: () => adminApi.publicaciones(q, estado === 'TODAS' ? undefined : estado),
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => adminApi.eliminarPublicacion(id),
    onSuccess: () => {
      toast.ok('Publicación eliminada')
      setAEliminar(null)
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
      void queryClient.invalidateQueries({ queryKey: ['mapa'] })
    },
  })

  return (
    <>
      <FlatList
        data={lista.data?.items ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, gap: 12, flexGrow: 1, ...centrado(anchoMaximo.contenido) }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 10 }}>
            <Buscador valor={texto} onCambio={setTexto} placeholder="Buscar por mascota, zona o autor" />
            <Segmentado<Filtro>
              valor={estado}
              onCambiar={setEstado}
              opciones={[{ id: 'TODAS', texto: 'Todas' }, { id: 'ACTIVA', texto: 'Activas' }, { id: 'ELIMINADA', texto: 'Eliminadas' }]}
            />
          </View>
        }
        renderItem={({ item: p }) => (
          <View style={estilos.item}>
            <Miniatura url={p.imagenUrl} />
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <Text style={estilos.titulo} numberOfLines={1}>{p.nombreMascota}</Text>
                {p.estado === 'ELIMINADA' && <Badge color="red">Eliminada</Badge>}
                {p.estado === 'ENCONTRADA' && <Badge color="green">Encontrada</Badge>}
                {p.reportesPendientes > 0 && <Badge color="orange">{`${p.reportesPendientes} reporte${p.reportesPendientes > 1 ? 's' : ''}`}</Badge>}
              </View>
              <Text style={estilos.tenue} numberOfLines={1}>{p.autorNombre} · {p.autorEmail}</Text>
              <Text style={estilos.tenue} numberOfLines={1}>{p.ubicacionTexto}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <Button compacto variante="secundario" icono="open-outline" onPress={() => router.push(`/publicacion/${p.id}`)}>Ver</Button>
                {p.estado !== 'ELIMINADA' && (
                  <Button compacto variante="secundario" icono="trash-outline" onPress={() => setAEliminar(p)}>Eliminar</Button>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          lista.isPending ? <Cargando /> : lista.isError ? <ErrorState onReintentar={() => void lista.refetch()} /> : (
            <EmptyState icono="search" titulo="Sin resultados" />
          )
        }
      />
      <ConfirmDialog
        abierto={!!aEliminar}
        titulo="Eliminar publicación"
        mensaje={`¿Eliminar la publicación de ${aEliminar?.nombreMascota ?? ''}? Quedará registrado en la auditoría.`}
        cargando={eliminar.isPending}
        onSi={() => aEliminar && eliminar.mutate(aEliminar.id)}
        onNo={() => setAEliminar(null)}
      />
    </>
  )
}

export default function AdminPublicacionesScreen() {
  return (
    <SoloAdmin>
      <Publicaciones />
    </SoloAdmin>
  )
}

const estilos = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: 12, ...sombra },
  titulo: { fontSize: 16, fontWeight: '800', color: colores.texto, flexShrink: 1 },
  tenue: { fontSize: 12, color: colores.textoTenue },
})
