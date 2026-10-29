import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../../components/Texto'
import { mediaUrl } from '../../lib/config'
import { colores, radio } from '../../lib/theme'
import { toast } from '../../lib/toast'
import type { Imagen } from '../../types/api'

export const MAX_IMAGENES = 5
const MAX_BYTES = 5 * 1024 * 1024

export interface FotoLocal {
  uri: string
  /** Solo en web: el archivo elegido (la `uri` es una URL blob: que no se puede releer como archivo). */
  archivo?: File
}

interface Props {
  existentes?: Imagen[]
  eliminadas?: string[]
  nuevas: FotoLocal[]
  error?: string
  onToggleExistente?: (id: string) => void
  onNuevas: (fotos: FotoLocal[]) => void
}

export function SubidorImagenes({ existentes = [], eliminadas = [], nuevas, error, onToggleExistente, onNuevas }: Props) {
  const total = existentes.filter((i) => !eliminadas.includes(i.id)).length + nuevas.length
  const disponibles = MAX_IMAGENES - total

  const agregar = (resultado: ImagePicker.ImagePickerResult) => {
    if (resultado.canceled) return
    const validas: FotoLocal[] = []
    for (const a of resultado.assets) {
      if (a.fileSize && a.fileSize > MAX_BYTES) toast.error('Una de las fotos supera los 5 MB.')
      else validas.push({ uri: a.uri, archivo: a.file })
    }
    if (validas.length > disponibles) toast.error(`Máximo ${MAX_IMAGENES} imágenes.`)
    onNuevas([...nuevas, ...validas.slice(0, disponibles)])
  }

  const desdeGaleria = async () => {
    agregar(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: disponibles,
        quality: 0.8,
      }),
    )
  }

  const desdeCamara = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync()
    if (!permiso.granted) return toast.error('Necesitamos permiso para usar la cámara.')
    agregar(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 }))
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={estilos.cabecera}>
        <Text style={estilos.etiqueta}>Fotos de la mascota</Text>
        <Text style={estilos.contador}>
          {total}/{MAX_IMAGENES} · la primera es la principal
        </Text>
      </View>

      <View style={estilos.grilla}>
        {existentes.map((img) => {
          const quitada = eliminadas.includes(img.id)
          return (
            <View key={img.id} style={estilos.celda}>
              <Image source={mediaUrl(img.urlMiniatura)} style={[StyleSheet.absoluteFill, quitada && { opacity: 0.3 }]} contentFit="cover" />
              <Pressable onPress={() => onToggleExistente?.(img.id)} style={estilos.quitar} hitSlop={6} accessibilityLabel={quitada ? 'Restaurar imagen' : 'Quitar imagen'}>
                <Ionicons name={quitada ? 'arrow-undo' : 'close'} size={16} color="#fff" />
              </Pressable>
            </View>
          )
        })}
        {nuevas.map((f, i) => (
          <View key={`${f.uri}-${i}`} style={estilos.celda}>
            <Image source={f.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
            <Pressable onPress={() => onNuevas(nuevas.filter((_, j) => j !== i))} style={estilos.quitar} hitSlop={6} accessibilityLabel="Quitar imagen">
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
          </View>
        ))}
        {disponibles > 0 && (
          <>
            <Pressable onPress={desdeGaleria} style={[estilos.celda, estilos.agregar]} accessibilityLabel="Elegir de la galería">
              <Ionicons name="images-outline" size={26} color={colores.textoTenue} />
              <Text style={estilos.agregarTexto}>Galería</Text>
            </Pressable>
            <Pressable onPress={desdeCamara} style={[estilos.celda, estilos.agregar]} accessibilityLabel="Tomar foto">
              <Ionicons name="camera-outline" size={26} color={colores.textoTenue} />
              <Text style={estilos.agregarTexto}>Cámara</Text>
            </Pressable>
          </>
        )}
      </View>
      {error && <Text style={estilos.error}>{error}</Text>}
    </View>
  )
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.textoSuave },
  contador: { fontSize: 12, color: colores.textoTenue },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  celda: { width: '31.5%', aspectRatio: 1, borderRadius: radio.md, overflow: 'hidden', backgroundColor: '#f5f5f4' },
  quitar: { position: 'absolute', top: 4, right: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  agregar: { borderWidth: 2, borderStyle: 'dashed', borderColor: colores.borde, backgroundColor: colores.tarjeta, alignItems: 'center', justifyContent: 'center', gap: 2 },
  agregarTexto: { fontSize: 12, fontWeight: '600', color: colores.textoTenue },
  error: { fontSize: 13, color: colores.peligro, fontWeight: '600' },
})
