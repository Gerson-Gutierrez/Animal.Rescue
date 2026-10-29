import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from '../../components/Texto'
import { adminApi } from '../../api/endpoints'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Fields'
import { Hoja } from '../../components/Modal'
import { Badge, Cargando, EmptyState, ErrorState, Segmentado } from '../../components/Ui'
import { Miniatura, SoloAdmin } from '../../features/admin/Comun'
import { formatFechaHora } from '../../lib/format'
import { anchoMaximo, centrado, colores, radio, sombra } from '../../lib/theme'
import { toast } from '../../lib/toast'
import { MOTIVOS_REPORTE, type Reporte } from '../../types/api'

type Accion = 'ACEPTAR' | 'RECHAZAR'

function ReporteItem({ r, onResolver }: { r: Reporte; onResolver: (accion: Accion) => void }) {
  const pendiente = r.estado === 'PENDIENTE'
  return (
    <View style={estilos.item}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Miniatura url={r.publicacionImagenUrl} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={estilos.titulo} numberOfLines={1}>{r.publicacionNombre}</Text>
            {r.publicacionEstado === 'ELIMINADA' && <Badge color="red">Eliminada</Badge>}
          </View>
          <Text style={estilos.tenue}>Autor: {r.autorNombre}</Text>
          <Text style={estilos.motivo}>{MOTIVOS_REPORTE[r.motivo]}</Text>
        </View>
      </View>
      {r.comentario && <Text style={estilos.comentario}>“{r.comentario}”</Text>}
      <Text style={estilos.tenue}>Reportado por {r.reportadoPorNombre} · {formatFechaHora(r.fechaCreacion)}</Text>
      {pendiente ? (
        <View style={estilos.acciones}>
          <Button compacto variante="secundario" style={{ flex: 1 }} onPress={() => router.push(`/publicacion/${r.publicacionId}`)}>Ver</Button>
          <Button compacto variante="secundario" style={{ flex: 1 }} onPress={() => onResolver('RECHAZAR')}>Descartar</Button>
          <Button compacto variante="peligro" style={{ flex: 1 }} onPress={() => onResolver('ACEPTAR')}>Eliminar</Button>
        </View>
      ) : (
        <Text style={estilos.tenue}>
          {r.estado === 'ACEPTADO' ? 'Publicación eliminada' : 'Descartado'}
          {r.revisadoPorNombre ? ` por ${r.revisadoPorNombre}` : ''}
          {r.notaRevision ? ` — ${r.notaRevision}` : ''}
        </Text>
      )}
    </View>
  )
}

function Reportes() {
  const queryClient = useQueryClient()
  const [vista, setVista] = useState<'PENDIENTE' | 'TODOS'>('PENDIENTE')
  const [resolviendo, setResolviendo] = useState<{ r: Reporte; accion: Accion } | null>(null)
  const [nota, setNota] = useState('')

  const reportes = useQuery({
    queryKey: ['admin', 'reportes', vista],
    queryFn: () => adminApi.reportes(vista === 'PENDIENTE' ? 'PENDIENTE' : undefined),
  })

  const resolver = useMutation({
    mutationFn: () => adminApi.resolverReporte(resolviendo!.r.id, resolviendo!.accion, nota.trim()),
    onSuccess: () => {
      toast.ok(resolviendo?.accion === 'ACEPTAR' ? 'Publicación eliminada' : 'Reporte descartado')
      setResolviendo(null)
      setNota('')
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
      void queryClient.invalidateQueries({ queryKey: ['mapa'] })
    },
  })

  return (
    <>
      <FlatList
        data={reportes.data?.items ?? []}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <ReporteItem r={item} onResolver={(accion) => setResolviendo({ r: item, accion })} />}
        contentContainerStyle={{ padding: 12, gap: 12, flexGrow: 1, ...centrado(anchoMaximo.contenido) }}
        onRefresh={() => void reportes.refetch()}
        refreshing={reportes.isRefetching}
        ListHeaderComponent={
          <Segmentado valor={vista} onCambiar={setVista} opciones={[{ id: 'PENDIENTE', texto: 'Pendientes' }, { id: 'TODOS', texto: 'Todos' }]} />
        }
        ListEmptyComponent={
          reportes.isPending ? <Cargando /> : reportes.isError ? <ErrorState onReintentar={() => void reportes.refetch()} /> : (
            <EmptyState icono="shield-checkmark-outline" titulo="Todo en orden" texto="No hay reportes para mostrar." />
          )
        }
      />
      <Hoja
        abierto={!!resolviendo}
        titulo={resolviendo?.accion === 'ACEPTAR' ? 'Eliminar publicación' : 'Descartar reporte'}
        onCerrar={() => setResolviendo(null)}
      >
        <View style={{ gap: 14 }}>
          <Text style={{ color: colores.textoSuave, fontSize: 15 }}>
            {resolviendo?.accion === 'ACEPTAR'
              ? `Se eliminará la publicación de ${resolviendo.r.publicacionNombre} y se cerrarán todos sus reportes.`
              : 'La publicación se mantendrá visible.'}
          </Text>
          <TextField etiqueta="Nota" opcional multiline maxLength={500} value={nota} onChangeText={setNota} />
          <Button variante={resolviendo?.accion === 'ACEPTAR' ? 'peligro' : 'primario'} cargando={resolver.isPending} onPress={() => resolver.mutate()}>
            Confirmar
          </Button>
        </View>
      </Hoja>
    </>
  )
}

export default function ReportesScreen() {
  return (
    <SoloAdmin>
      <Reportes />
    </SoloAdmin>
  )
}

const estilos = StyleSheet.create({
  item: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: 12, gap: 8, ...sombra },
  titulo: { fontSize: 16, fontWeight: '800', color: colores.texto, flexShrink: 1 },
  tenue: { fontSize: 12, color: colores.textoTenue },
  motivo: { fontSize: 14, fontWeight: '700', color: colores.marcaOscuro },
  comentario: { fontSize: 14, color: colores.textoSuave, backgroundColor: '#fafaf9', borderRadius: radio.sm, padding: 8 },
  acciones: { flexDirection: 'row', gap: 8 },
})
