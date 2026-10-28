import { Ionicons } from '@expo/vector-icons'
import { useInfiniteQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native'
import { publicacionesApi } from '../../api/endpoints'
import { Button } from '../../components/Button'
import { Cargando, EmptyState, ErrorState } from '../../components/Ui'
import { PublicacionCard } from '../../features/publicaciones/PublicacionCard'
import { colores, radio } from '../../lib/theme'
import { useDebounce } from '../../lib/useDebounce'

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

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={estilos.lista}
      renderItem={({ item }) => <PublicacionCard p={item} />}
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
  lista: { padding: 12, gap: 12, flexGrow: 1 },
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
