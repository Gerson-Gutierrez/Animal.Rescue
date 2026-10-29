import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Text } from '../../../components/Texto'
import { adminApi, mensajesApi, publicacionesApi } from '../../../api/endpoints'
import { mensajeError } from '../../../api/http'
import { Button } from '../../../components/Button'
import { ConfirmDialog } from '../../../components/Modal'
import { Avatar, Badge, Cargando, ErrorState } from '../../../components/Ui'
import { Mapa } from '../../../features/mapa/Mapa'
import { ReportarDialog } from '../../../features/publicaciones/ReportarDialog'
import { mediaUrl } from '../../../lib/config'
import { formatFecha, formatMoneda } from '../../../lib/format'
import { anchoMaximo, centrado, colores, radio } from '../../../lib/theme'
import { toast } from '../../../lib/toast'
import { useAuthStore, useRol } from '../../../store/auth'
import { TAMANOS } from '../../../types/api'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.dato}>
      <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
      <Text style={estilos.datoValor}>{valor}</Text>
    </View>
  )
}

export default function DetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  // En web/tablet la galería no pasa del ancho del contenido.
  const ancho = Math.min(useWindowDimensions().width, anchoMaximo.contenido)
  const queryClient = useQueryClient()
  const autenticado = useAuthStore((s) => !!s.usuario)
  const { esAdmin } = useRol()
  const [reportando, setReportando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [foto, setFoto] = useState(0)

  const { data: p, isPending, isError, refetch } = useQuery({
    // El detalle depende de quién mira (esMia, yaReportada).
    queryKey: ['publicacion', id, autenticado],
    queryFn: () => publicacionesApi.detalle(id),
  })

  const abrirChat = useMutation({
    mutationFn: () => mensajesApi.abrir({ destinatarioId: p!.autor.id, publicacionId: p!.id }),
    onSuccess: (c) => router.push({ pathname: '/chat/[id]', params: { id: c.id, nombre: c.otro.nombre } }),
    onError: (e) => toast.error(mensajeError(e)),
  })

  const eliminarAdmin = useMutation({
    mutationFn: () => adminApi.eliminarPublicacion(id),
    onSuccess: () => {
      toast.ok('Publicación eliminada')
      setEliminando(false)
      void queryClient.invalidateQueries()
      router.back()
    },
  })

  const conSesion = (accion: () => void) => (autenticado ? accion() : router.push('/login'))

  if (isPending) return <Cargando />
  if (isError || !p) return <ErrorState onReintentar={() => void refetch()} />

  const puedeReportar = !p.esMia && p.estado !== 'ELIMINADA'

  return (
    <>
      <Stack.Screen
        options={{
          title: p.nombreMascota,
          headerRight: () =>
            puedeReportar ? (
              <Pressable
                onPress={() => conSesion(() => setReportando(true))}
                disabled={p.yaReportada}
                hitSlop={10}
                accessibilityLabel={p.yaReportada ? 'Ya reportaste esta publicación' : 'Reportar publicación'}
              >
                <Ionicons name="flag-outline" size={22} color={p.yaReportada ? colores.borde : colores.textoSuave} />
              </Pressable>
            ) : null,
        }}
      />
      {/* Fondo blanco liso: sobre las huellas los datos se pierden visualmente. */}
      <ScrollView style={{ backgroundColor: colores.tarjeta }} contentContainerStyle={{ paddingBottom: 32, ...centrado(anchoMaximo.contenido) }}>
        {/* Galería: se desliza horizontalmente */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setFoto(Math.round(e.nativeEvent.contentOffset.x / ancho))}
          style={{ backgroundColor: '#1c1917' }}
        >
          {p.imagenes.map((img) => (
            <Image key={img.id} source={mediaUrl(img.url)} style={{ width: ancho, height: ancho * 0.8 }} contentFit="contain" />
          ))}
        </ScrollView>
        {p.imagenes.length > 1 && (
          <View style={estilos.puntos}>
            {p.imagenes.map((img, i) => (
              <View key={img.id} style={[estilos.punto, i === foto && estilos.puntoActivo]} />
            ))}
          </View>
        )}

        <View style={estilos.cuerpo}>
          <View style={estilos.badges}>
            {p.estado === 'ENCONTRADA' && <Badge color="green">¡Encontrada!</Badge>}
            {p.estado === 'ELIMINADA' && <Badge color="red">Eliminada</Badge>}
            {p.tieneCollar && <Badge color="orange">Con collar</Badge>}
            {p.tieneChapitaQr && <Badge color="orange">Chapita QR</Badge>}
          </View>

          <View style={estilos.grilla}>
            <Dato etiqueta="Color" valor={p.color} />
            <Dato etiqueta="Tamaño" valor={TAMANOS[p.tamano]} />
            <Dato etiqueta="Edad" valor={p.edad ?? 'No indicada'} />
            <Dato etiqueta="Castrado/a" valor={p.castrado ? 'Sí' : 'No'} />
          </View>

          {p.recompensa !== null && (
            <View style={estilos.recompensa}>
              <Ionicons name="ribbon-outline" size={26} color={colores.ambarTexto} />
              <View>
                <Text style={{ fontSize: 12, color: colores.ambarTexto }}>Recompensa</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colores.ambarTexto }}>{formatMoneda(p.recompensa)}</Text>
              </View>
            </View>
          )}

          {p.descripcion && (
            <View style={{ gap: 4 }}>
              <Text style={estilos.subtitulo}>Detalles</Text>
              <Text style={estilos.texto}>{p.descripcion}</Text>
            </View>
          )}

          <View style={{ gap: 8 }}>
            <View style={estilos.fila}>
              <Ionicons name="location" size={18} color={colores.marca} />
              <Text style={[estilos.texto, { flex: 1 }]}>{p.ubicacionTexto}</Text>
            </View>
            <View style={estilos.fila}>
              <Ionicons name="calendar" size={18} color={colores.marca} />
              <Text style={estilos.texto}>Se perdió el {formatFecha(p.fechaPerdida)}</Text>
            </View>
            <Mapa
              style={estilos.mapa}
              centro={{ lat: p.latitud, lng: p.longitud }}
              zoom={15}
              interactivo={false}
              pines={[{ id: p.id, lat: p.latitud, lng: p.longitud, tipo: 'patita' }]}
            />
          </View>

          <View style={estilos.autor}>
            <Avatar nombre={p.autor.nombre} fotoUrl={p.autor.fotoUrl} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colores.textoTenue }}>Publicado por</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colores.texto }}>{p.autor.nombre}</Text>
            </View>
          </View>

          {p.esMia ? (
            <Button variante="secundario" icono="create-outline" onPress={() => router.push(`/publicacion/${p.id}/editar`)}>
              Editar publicación
            </Button>
          ) : (
            p.estado !== 'ELIMINADA' && (
              <Button icono="chatbubble-ellipses-outline" cargando={abrirChat.isPending} onPress={() => conSesion(() => abrirChat.mutate())}>
                Enviar mensaje
              </Button>
            )
          )}

          {esAdmin && p.estado !== 'ELIMINADA' && (
            <Button variante="peligro" icono="shield-checkmark-outline" onPress={() => setEliminando(true)}>
              Eliminar (administrador)
            </Button>
          )}
        </View>
      </ScrollView>

      <ReportarDialog publicacionId={p.id} abierto={reportando} onCerrar={() => setReportando(false)} />
      <ConfirmDialog
        abierto={eliminando}
        titulo="Eliminar publicación"
        mensaje="La publicación dejará de ser visible para todos. ¿Quieres eliminarla?"
        cargando={eliminarAdmin.isPending}
        onSi={() => eliminarAdmin.mutate()}
        onNo={() => setEliminando(false)}
      />
    </>
  )
}

const estilos = StyleSheet.create({
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 10 },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: colores.borde },
  puntoActivo: { backgroundColor: colores.marca },
  cuerpo: { padding: 16, gap: 18 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dato: { width: '48.5%', backgroundColor: colores.fondo, borderColor: colores.bordeSuave, borderWidth: 1, borderRadius: radio.md, paddingHorizontal: 12, paddingVertical: 8 },
  datoEtiqueta: { fontSize: 12, color: colores.textoTenue },
  datoValor: { fontSize: 15, fontWeight: '700', color: colores.texto },
  recompensa: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.ambar, borderColor: colores.ambarBorde, borderWidth: 1, borderRadius: radio.md, padding: 12 },
  subtitulo: { fontSize: 14, fontWeight: '800', color: colores.texto },
  texto: { fontSize: 15, lineHeight: 22, color: colores.textoSuave },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mapa: { height: 180, borderRadius: radio.lg, overflow: 'hidden' },
  autor: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.fondo, borderColor: colores.bordeSuave, borderWidth: 1, borderRadius: radio.md, padding: 12 },
})
