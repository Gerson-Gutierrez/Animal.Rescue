import { Ionicons } from '@expo/vector-icons'
import { useInfiniteQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native'
import { TextInput } from '../../components/Texto'
import { publicacionesApi } from '../../api/endpoints'
import { Button } from '../../components/Button'
import { Cargando, EmptyState, ErrorState } from '../../components/Ui'
import { PublicacionCard } from '../../features/publicaciones/PublicacionCard'
import { anchoMaximo, centrado, colores, radio } from '../../lib/theme'
import { useDebounce } from '../../lib/useDebounce'
import type { PublicacionCard as Card } from '../../types/api'

const ANCHO_CARD_MIN = 200

export default function FeedScreen() {
  const [texto, setTexto] = useState('')
  const q = useDebounce(texto.trim(), 400)

  const feed = useInfiniteQuery({
    queryKey: ['feed', q],
    queryFn: ({ pageParam }) => publicacionesApi.feed(pageParam, q),
    initialPageParam: 1,
    getNextPageParam: (ultima) => (ultima.hayMas ? ultima.pagina + 1 : undefined),
  })

  const items = feed.data?.pages.flatMap((p) => p.items) ?? []

  // Columnas según el ancho: 2 en teléfono y más en tablet/web, con cards de ~200px como mínimo.
  const { width } = useWindowDimensions()
  const anchoLista = Math.min(width, anchoMaximo.lista)
  const columnas = Math.max(2, Math.min(5, Math.floor((anchoLista - 12) / (ANCHO_CARD_MIN + 12))))
  // Huecos invisibles para que la última fila incompleta no estire sus cards.
  const relleno = (columnas - (items.length % columnas)) % columnas
  const datos: (Card | null)[] = relleno > 0 ? [...items, ...Array<null>(relleno).fill(null)] : items

  return (
    <FlatList
      // numColumns no puede cambiar en caliente: se remonta la lista al cambiar.
      key={columnas}
      data={datos}
      keyExtractor={(p, i) => p?.id ?? `hueco-${i}`}
      numColumns={columnas}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={estilos.lista}
      renderItem={({ item }) => (item ? <PublicacionCard p={item} /> : <View style={{ flex: 1 }} />)}
      onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && void feed.fetchNextPage()}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => void feed.refetch()} colors={[colores.marca]} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={estilos.buscador}>
          <Ionicons name="search" size={18} color={colores.textoTenue} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar por nombre o zona"
            placeholderTextColor={colores.textoTenue}
            accessibilityLabel="Buscar publicaciones"
            returnKeyType="search"
            style={estilos.input}
          />
        </View>
      }
      ListEmptyComponent={
        feed.isPending ? (
          <Cargando />
        ) : feed.isError ? (
          <ErrorState onReintentar={() => void feed.refetch()} />
        ) : (
          <EmptyState
            icono="paw-outline"
            titulo={q ? 'Sin resultados' : 'Aún no hay publicaciones'}
            texto={q ? 'Prueba con otro nombre o zona.' : 'Cuando alguien publique una mascota perdida aparecerá aquí.'}
            accion={!q && <Button icono="add" onPress={() => router.push('/publicar')}>Publicar mascota</Button>}
          />
        )
      }
      ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colores.marca} style={{ marginVertical: 16 }} /> : undefined}
    />
  )
}

const estilos = StyleSheet.create({
  lista: { padding: 12, gap: 12, flexGrow: 1, ...centrado(anchoMaximo.lista) },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.md,
    paddingHorizontal: 12,
    marginBottom: 0,
  },
  input: { flex: 1, minHeight: 46, fontSize: 16, color: colores.texto },
})
