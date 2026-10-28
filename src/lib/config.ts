import Constants from 'expo-constants'

/**
 * URL de la API. En Expo Go se usa la misma IP de la PC que sirve el proyecto (la que muestra el QR),
 * con el puerto 5080. Se puede forzar con EXPO_PUBLIC_API_URL en el archivo .env.
 */
function urlPorDefecto(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? ''
  const host = hostUri.split(':')[0]
  return host ? `http://${host}:5080` : 'http://localhost:5080'
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || urlPorDefecto()).replace(/\/$/, '')

/** Centro inicial de los mapas cuando no hay ubicación (Buenos Aires). */
export const CENTRO_POR_DEFECTO = { lat: -34.6037, lng: -58.3816, zoom: 11 }

/**
 * Teselas de OpenStreetMap: gratis y sin clave, pero con política de uso justo
 * (https://operations.osmfoundation.org/policies/tiles/). Para mucho tráfico, cambiar por un proveedor propio.
 */
export const MAPA_TESELAS = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  atribucion: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}

export function mediaUrl(ruta: string | null | undefined): string | undefined {
  if (!ruta) return undefined
  return /^https?:/i.test(ruta) ? ruta : `${API_URL}${ruta}`
}
