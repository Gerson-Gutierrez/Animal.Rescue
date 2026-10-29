import { Image } from 'expo-image'
import type { ReactNode } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { colores } from '../lib/theme'

const mosaico = require('../../assets/images/fondo-patitas.png')
// El mosaico mide 489×332 px; se dibuja a la mitad para que las huellas se vean pequeñas.
const ANCHO = 489 / 2
const ALTO = 332 / 2

/** Fondo de huellas y huesos repetido detrás de cada pantalla. */
export function FondoPatitas({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions()
  const columnas = Math.ceil(width / ANCHO)
  const filas = Math.ceil(height / ALTO)

  return (
    <View style={estilos.contenedor}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: filas * columnas }, (_, i) => (
          <Image
            key={i}
            source={mosaico}
            style={[estilos.mosaico, { left: (i % columnas) * ANCHO, top: Math.floor(i / columnas) * ALTO }]}
          />
        ))}
        <View style={[StyleSheet.absoluteFill, estilos.velo]} />
      </View>
      {children}
    </View>
  )
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff', overflow: 'hidden' },
  mosaico: { position: 'absolute', width: ANCHO, height: ALTO },
  // Suaviza el patrón para que el texto encima siga siendo legible.
  velo: { backgroundColor: colores.fondo, opacity: 0.45 },
})
