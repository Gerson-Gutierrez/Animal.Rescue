import { File } from 'expo-file-system'
import { API_URL } from '../lib/config'
import { useAuthStore } from '../store/auth'
import type { AuthResponse } from '../types/api'

interface Problema {
  title?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public problema: Problema | null,
  ) {
    super(problema?.title ?? `Error ${status}`)
  }
}

type Params = Record<string, string | number | undefined | null>

interface Opciones {
  body?: unknown
  form?: FormData
  params?: Params
}

const TIEMPO_MAXIMO_MS = 30_000

function construirUrl(ruta: string, params?: Params): string {
  const qs = Object.entries(params ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return `${API_URL}/api${ruta}${qs ? `?${qs}` : ''}`
}

async function ejecutar(metodo: string, ruta: string, op: Opciones, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  // Con FormData no se fija Content-Type: fetch agrega el boundary del multipart.
  if (op.body !== undefined) headers['Content-Type'] = 'application/json'

  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS)
  try {
    return await fetch(construirUrl(ruta, op.params), {
      method: metodo,
      headers,
      body: op.form ?? (op.body !== undefined ? JSON.stringify(op.body) : undefined),
      signal: control.signal,
    })
  } finally {
    clearTimeout(temporizador)
  }
}

// Una sola renovación de token a la vez, aunque fallen varias peticiones juntas.
let renovando: Promise<string | null> | null = null

async function renovarToken(): Promise<string | null> {
  const { refreshToken, setSesion, cerrarSesion } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const r = await ejecutar('POST', '/auth/refresh', { body: { refreshToken } }, null)
    if (!r.ok) throw new Error()
    const sesion = (await r.json()) as AuthResponse
    setSesion(sesion)
    return sesion.accessToken
  } catch {
    cerrarSesion()
    return null
  }
}

async function solicitar<T>(metodo: string, ruta: string, op: Opciones = {}): Promise<T> {
  let respuesta = await ejecutar(metodo, ruta, op, useAuthStore.getState().accessToken)

  if (respuesta.status === 401 && !ruta.startsWith('/auth/')) {
    renovando ??= renovarToken().finally(() => (renovando = null))
    const token = await renovando
    if (token) respuesta = await ejecutar(metodo, ruta, op, token)
  }

  if (!respuesta.ok) {
    const problema = await respuesta.json().catch(() => null)
    throw new ApiError(respuesta.status, problema)
  }
  if (respuesta.status === 204) return undefined as T
  const texto = await respuesta.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}

export const http = {
  get: <T>(ruta: string, params?: Params) => solicitar<T>('GET', ruta, { params }),
  post: <T>(ruta: string, body?: unknown) => solicitar<T>('POST', ruta, { body }),
  put: <T>(ruta: string, body?: unknown) => solicitar<T>('PUT', ruta, { body }),
  delete: <T = void>(ruta: string) => solicitar<T>('DELETE', ruta),
  postForm: <T>(ruta: string, form: FormData) => solicitar<T>('POST', ruta, { form }),
  putForm: <T>(ruta: string, form: FormData) => solicitar<T>('PUT', ruta, { form }),
}

/**
 * Archivo local (foto elegida) para adjuntar a un FormData.
 * Desde el SDK 58 el `fetch` global es `expo/fetch`, que no acepta el objeto `{ uri, name, type }` de
 * React Native ("Unsupported FormDataPart implementation"); sí acepta un `File` de expo-file-system.
 */
export function archivoForm(uri: string): Blob {
  return new File(uri)
}

export function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    const detalles = error.problema?.errors ? Object.values(error.problema.errors).flat() : []
    if (detalles.length) return detalles.join(' ')
    if (error.status === 429) return 'Demasiados intentos. Espera un momento.'
    return error.problema?.title ?? `Error ${error.status}`
  }
  if (error instanceof Error && (error.name === 'AbortError' || /network request failed/i.test(error.message)))
    return `No se pudo conectar con el servidor (${API_URL}). Revisa que el backend esté encendido y en la misma red Wi-Fi.`
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}
