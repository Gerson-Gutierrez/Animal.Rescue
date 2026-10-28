import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import { colores } from '../../lib/theme'

export function Marca() {
  return (
    <View style={estilos.marca}>
      <Image source={require('../../../assets/images/logo.png')} style={estilos.logo} contentFit="contain" />
      <Text style={estilos.titulo}>Animal Rescue</Text>
      <Text style={estilos.subtitulo}>Ayudamos a que las mascotas perdidas vuelvan a casa.</Text>
    </View>
  )
}

export const estilos = StyleSheet.create({
  contenedor: { padding: 24, gap: 16, flexGrow: 1, justifyContent: 'center' },
  marca: { alignItems: 'center', marginBottom: 12 },
  logo: { width: 96, height: 96, marginBottom: 12 },
  titulo: { fontSize: 26, fontWeight: '900', color: colores.texto },
  subtitulo: { fontSize: 14, color: colores.textoTenue, marginTop: 4, textAlign: 'center' },
  pie: { textAlign: 'center', color: colores.textoSuave, fontSize: 14, marginTop: 8 },
  enlace: { color: colores.marcaOscuro, fontWeight: '800', textDecorationLine: 'underline' },
})
