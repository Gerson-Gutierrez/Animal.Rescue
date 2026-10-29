export const colores = {
  marca: '#ea580c',
  marcaOscuro: '#c2410c',
  marcaClaro: '#ffedd5',
  marcaFondo: '#fff7ed',
  refugio: '#2f6347',
  fondo: '#f5f1ec',
  tarjeta: '#ffffff',
  texto: '#1c1917',
  textoSuave: '#57534e',
  textoTenue: '#78716c',
  borde: '#d6d3d1',
  bordeSuave: '#e7e5e4',
  peligro: '#dc2626',
  peligroClaro: '#fee2e2',
  exito: '#047857',
  exitoClaro: '#d1fae5',
  ambar: '#fffbeb',
  ambarBorde: '#fde68a',
  ambarTexto: '#78350f',
}

/** Familias de Fredoka (@expo-google-fonts/fredoka) cargadas en el layout raíz. */
export const fuentes = {
  normal: 'Fredoka_400Regular',
  media: 'Fredoka_500Medium',
  seminegrita: 'Fredoka_600SemiBold',
  negrita: 'Fredoka_700Bold',
}

/** Anchos máximos para pantallas grandes (web/tablet): el contenido se centra en vez de estirarse. */
export const anchoMaximo = { lista: 1200, contenido: 760, formulario: 560 }

export function centrado(max: number) {
  return { width: '100%', maxWidth: max, alignSelf: 'center' } as const
}

export const radio = { sm: 8, md: 12, lg: 16, xl: 24, total: 999 }

export const sombra = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
}
