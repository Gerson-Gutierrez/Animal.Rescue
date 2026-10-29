import type { ComponentProps } from 'react'
import { Text as RNText, TextInput as RNTextInput, StyleSheet, type TextStyle } from 'react-native'
import { fuentes } from '../lib/theme'

/**
 * Cada grosor de Fredoka es una familia distinta: se elige la que corresponde
 * al fontWeight y se deja el peso en 'normal' para que Android/iOS no la cambien
 * por la del sistema ni le apliquen negrita falsa.
 */
export function estiloFuente(peso: TextStyle['fontWeight'] = 'normal') {
  const n = peso === 'bold' ? 700 : peso === 'normal' || peso == null ? 400 : Number(peso)
  const fontFamily = n >= 700 ? fuentes.negrita : n >= 600 ? fuentes.seminegrita : n >= 500 ? fuentes.media : fuentes.normal
  return { fontFamily, fontWeight: 'normal' } as const
}

export function Text({ style, ...rest }: ComponentProps<typeof RNText>) {
  return <RNText {...rest} style={[style, estiloFuente(StyleSheet.flatten(style)?.fontWeight)]} />
}

export function TextInput({ style, ...rest }: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput {...rest} style={[style, estiloFuente(StyleSheet.flatten(style)?.fontWeight)]} />
}
