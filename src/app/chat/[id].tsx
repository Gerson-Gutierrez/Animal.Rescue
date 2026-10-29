import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Text, TextInput } from '../../components/Texto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mensajesApi } from '../../api/endpoints'
import { archivoForm, mensajeError } from '../../api/http'
import { Cargando, ErrorState } from '../../components/Ui'
import { useConversaciones } from '../../features/mensajes/hooks'
import type { FotoLocal } from '../../features/publicaciones/SubidorImagenes'
import { mediaUrl } from '../../lib/config'
import { formatFechaHora } from '../../lib/format'
import { anchoMaximo, centrado, colores, radio } from '../../lib/theme'
import { toast } from '../../lib/toast'
import { useAuthStore } from '../../store/auth'
import type { Mensaje } from '../../types/api'

const LOTE = 30

function Burbuja({ m, propio }: { m: Mensaje; propio: boolean }) {
  const imagen = mediaUrl(m.imagenUrl)
  return (
    <View style={[estilos.burbuja, propio ? estilos.propia : estilos.ajena]}>
      {imagen && <Image source={imagen} style={estilos.imagen} contentFit="cover" />}
      {m.contenido && <Text style={[estilos.textoBurbuja, propio && { color: '#fff' }]}>{m.contenido}</Text>}
      <Text style={[estilos.hora, propio && { color: colores.marcaClaro }]}>{formatFechaHora(m.fechaEnvio)}</Text>
    </View>
  )
}

export default function ChatScreen() {
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>()
  const queryClient = useQueryClient()
  const yo = useAuthStore((s) => s.usuario?.id)
  const alturaCabecera = useHeaderHeight()
  const insets = useSafeAreaInsets()

  const lista = useConversaciones()
  const resumen = lista.data?.find((c) => c.id === id)

  const reciente = useQuery({ queryKey: ['mensajes', id], queryFn: () => mensajesApi.mensajes(id), staleTime: 0, enabled: !!yo })
  const [anteriores, setAnteriores] = useState<Mensaje[]>([])
  const [hayMas, setHayMas] = useState<boolean | null>(null)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState<FotoLocal | null>(null)

  const mensajes = useMemo(() => [...anteriores, ...(reciente.data ?? [])], [anteriores, reciente.data])
  // La lista está invertida (lo más nuevo abajo), así que se le pasan los mensajes del más nuevo al más viejo.
  const invertidos = useMemo(() => [...mensajes].reverse(), [mensajes])
  const ultimo = mensajes.at(-1)
  const hayAnteriores = hayMas ?? reciente.data?.length === LOTE

  const marcarLeida = useMutation({
    mutationFn: () => mensajesApi.marcarLeida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversaciones'] }),
  })
  const { mutate: marcar } = marcarLeida
  useEffect(() => {
    if (reciente.isSuccess && ultimo && ultimo.remitenteId !== yo) marcar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimo?.id, reciente.isSuccess])

  const cargarAnteriores = async () => {
    const primero = mensajes[0]
    if (!primero || cargandoMas || !hayAnteriores) return
    setCargandoMas(true)
    try {
      const lote = await mensajesApi.mensajes(id, primero.fechaEnvio)
      setAnteriores((a) => [...lote, ...a])
      setHayMas(lote.length === LOTE)
    } catch (e) {
      toast.error(mensajeError(e))
    } finally {
      setCargandoMas(false)
    }
  }

  const enviar = useMutation({
    mutationFn: () => {
      const form = new FormData()
      if (texto.trim()) form.append('contenido', texto.trim())
      if (foto) form.append('imagen', archivoForm(foto))
      return mensajesApi.enviar(id, form)
    },
    onSuccess: (m) => {
      queryClient.setQueryData<Mensaje[]>(['mensajes', id], (previos) => (previos ? [...previos, m] : [m]))
      void queryClient.invalidateQueries({ queryKey: ['conversaciones'] })
      setTexto('')
      setFoto(null)
    },
    onError: (e) => toast.error(mensajeError(e)),
  })

  const elegirFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (r.canceled) return
    const a = r.assets[0]
    if (a.fileSize && a.fileSize > 5 * 1024 * 1024) return toast.error('La imagen supera los 5 MB.')
    setFoto({ uri: a.uri, archivo: a.file })
  }

  const puedeEnviar = (!!texto.trim() || !!foto) && !enviar.isPending

  if (!yo) return <Redirect href="/login" />

  return (
    <>
      <Stack.Screen options={{ title: resumen?.otro.nombre ?? nombre ?? 'Conversación' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={alturaCabecera}>
        {resumen?.publicacionId && (
          <Pressable onPress={() => router.push(`/publicacion/${resumen.publicacionId}`)} style={estilos.banner}>
            <Ionicons name="paw" size={16} color={colores.marcaOscuro} />
            <Text style={estilos.bannerTexto} numberOfLines={1}>Ver publicación{resumen.publicacionNombre ? `: ${resumen.publicacionNombre}` : ''}</Text>
            <Ionicons name="chevron-forward" size={16} color={colores.marcaOscuro} />
          </Pressable>
        )}

        {reciente.isPending ? (
          <Cargando />
        ) : reciente.isError ? (
          <ErrorState onReintentar={() => void reciente.refetch()} />
        ) : (
          <FlatList
            inverted
            data={invertidos}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <Burbuja m={item} propio={item.remitenteId === yo} />}
            contentContainerStyle={estilos.lista}
            onEndReached={cargarAnteriores}
            onEndReachedThreshold={0.3}
            ListFooterComponent={cargandoMas ? <ActivityIndicator color={colores.marca} style={{ margin: 12 }} /> : undefined}
            ListEmptyComponent={
              <Text style={estilos.vacio}>Escribe el primer mensaje para {resumen?.otro.nombre ?? nombre ?? 'iniciar la conversación'}.</Text>
            }
          />
        )}

        <View style={[estilos.barra, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {foto && (
            <View style={estilos.previa}>
              <Image source={foto.uri} style={estilos.previaImagen} contentFit="cover" />
              <Pressable onPress={() => setFoto(null)} style={estilos.quitarPrevia} accessibilityLabel="Quitar imagen">
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          )}
          <View style={estilos.filaEntrada}>
            <Pressable onPress={elegirFoto} style={estilos.botonRedondo} accessibilityLabel="Adjuntar imagen">
              <Ionicons name="image-outline" size={26} color={colores.textoSuave} />
            </Pressable>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribe un mensaje"
              placeholderTextColor={colores.textoTenue}
              multiline
              maxLength={4000}
              style={estilos.entrada}
              accessibilityLabel="Mensaje"
            />
            <Pressable
              onPress={() => puedeEnviar && enviar.mutate()}
              disabled={!puedeEnviar}
              style={[estilos.botonRedondo, estilos.enviar, !puedeEnviar && { backgroundColor: colores.borde }]}
              accessibilityLabel="Enviar"
            >
              {enviar.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

const estilos = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colores.marcaFondo, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.marcaClaro },
  bannerTexto: { flex: 1, fontSize: 14, fontWeight: '700', color: colores.marcaOscuro },
  lista: { padding: 12, gap: 8, flexGrow: 1, ...centrado(anchoMaximo.contenido) },
  burbuja: { maxWidth: '80%', borderRadius: 18, overflow: 'hidden' },
  propia: { alignSelf: 'flex-end', backgroundColor: colores.marca, borderBottomRightRadius: 6 },
  ajena: { alignSelf: 'flex-start', backgroundColor: colores.tarjeta, borderBottomLeftRadius: 6 },
  imagen: { width: 240, height: 200 },
  textoBurbuja: { fontSize: 15, lineHeight: 21, color: colores.texto, paddingHorizontal: 14, paddingTop: 8 },
  hora: { fontSize: 10, color: colores.textoTenue, alignSelf: 'flex-end', paddingHorizontal: 12, paddingBottom: 6, paddingTop: 4 },
  vacio: { textAlign: 'center', color: colores.textoTenue, marginTop: 40, transform: [{ scaleY: -1 }] },
  barra: { backgroundColor: colores.tarjeta, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde, paddingHorizontal: 8, paddingTop: 8 },
  previa: { marginLeft: 8, marginBottom: 8, alignSelf: 'flex-start' },
  previaImagen: { width: 72, height: 72, borderRadius: radio.sm },
  quitarPrevia: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colores.texto, alignItems: 'center', justifyContent: 'center' },
  filaEntrada: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  botonRedondo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  enviar: { backgroundColor: colores.marca },
  entrada: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: colores.borde, borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 16, color: colores.texto },
})
