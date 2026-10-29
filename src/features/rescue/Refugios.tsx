import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { Text, TextInput } from '../../components/Texto'
import { rescueApi } from '../../api/endpoints'
import { mensajeError } from '../../api/http'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/Modal'
import { CENTRO_POR_DEFECTO } from '../../lib/config'
import { colores, radio } from '../../lib/theme'
import { toast } from '../../lib/toast'
import { useAuthStore } from '../../store/auth'
import type { Refugio } from '../../types/api'
import { Mapa, type MapaRef } from '../mapa/Mapa'

export function Refugios() {
  const queryClient = useQueryClient()
  const autenticado = useAuthStore((s) => !!s.usuario)
  const mapa = useRef<MapaRef>(null)
  const [direccion, setDireccion] = useState('')
  const [aEliminar, setAEliminar] = useState<Refugio | null>(null)

  const refugios = useQuery({ queryKey: ['refugios'], queryFn: rescueApi.refugios })

  const agregar = useMutation({
    mutationFn: () => rescueApi.agregarRefugio(direccion.trim()),
    onSuccess: (r) => {
      toast.ok('Refugio agregado al mapa')
      setDireccion('')
      mapa.current?.volarA(r.latitud, r.longitud, 15)
      void queryClient.invalidateQueries({ queryKey: ['refugios'] })
    },
    onError: (e) => toast.error(mensajeError(e)),
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => rescueApi.eliminarRefugio(id),
    onSuccess: () => {
      toast.ok('Dirección eliminada')
      setAEliminar(null)
      void queryClient.invalidateQueries({ queryKey: ['refugios'] })
    },
  })

  const alMantenerPresionado = (id: string) => {
    const r = refugios.data?.find((x) => x.id === id)
    if (!r) return
    if (r.puedeEliminar) setAEliminar(r)
    else toast.error('Sólo quien agregó este refugio puede eliminarlo.')
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, gap: 12 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={140}>
      <View style={estilos.mapa}>
        <Mapa
          ref={mapa}
          style={StyleSheet.absoluteFill}
          centro={CENTRO_POR_DEFECTO}
          zoom={CENTRO_POR_DEFECTO.zoom}
          pines={(refugios.data ?? []).map((r) => ({
            id: r.id,
            lat: r.latitud,
            lng: r.longitud,
            tipo: 'refugio' as const,
            titulo: r.nombre ?? 'Refugio',
            descripcion: r.direccion,
          }))}
          onPinLargo={alMantenerPresionado}
        />
      </View>

      {autenticado ? (
        <View style={estilos.fila}>
          <TextInput
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Agregar refugio: escribe la dirección"
            placeholderTextColor={colores.textoTenue}
            accessibilityLabel="Agregar refugio"
            maxLength={300}
            returnKeyType="done"
            onSubmitEditing={() => direccion.trim().length >= 3 && agregar.mutate()}
            style={estilos.entrada}
          />
          <Button icono="add" cargando={agregar.isPending} deshabilitado={direccion.trim().length < 3} onPress={() => agregar.mutate()}>
            Agregar
          </Button>
        </View>
      ) : (
        <Button variante="secundario" onPress={() => router.push('/login')}>Inicia sesión para agregar refugios</Button>
      )}

      <Text style={estilos.ayuda}>
        {refugios.data?.length ?? 0} refugios en el mapa. Para eliminar uno que agregaste, mantén presionado su ícono.
      </Text>

      <ConfirmDialog
        abierto={!!aEliminar}
        titulo="¿Eliminar esta dirección?"
        mensaje={aEliminar ? `${aEliminar.nombre ? aEliminar.nombre + ' · ' : ''}${aEliminar.direccion}` : ''}
        cargando={eliminar.isPending}
        onSi={() => aEliminar && eliminar.mutate(aEliminar.id)}
        onNo={() => setAEliminar(null)}
      />
    </KeyboardAvoidingView>
  )
}

const estilos = StyleSheet.create({
  mapa: { flex: 1, minHeight: 280, borderRadius: radio.lg, overflow: 'hidden' },
  fila: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  entrada: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colores.borde, borderRadius: radio.md, backgroundColor: colores.tarjeta, paddingHorizontal: 14, fontSize: 16, color: colores.texto },
  ayuda: { fontSize: 12, color: colores.textoTenue, paddingBottom: 8 },
})
