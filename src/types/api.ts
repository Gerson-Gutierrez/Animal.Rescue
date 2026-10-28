// Espejo de los DTOs de AnimalRescue.BLL

export type Rol = 'USUARIO' | 'ADMIN' | 'SUPERADMIN'
export type Tamano = 'GRANDE' | 'MEDIANO' | 'PEQUENO'
export type EstadoPublicacion = 'ACTIVA' | 'ENCONTRADA' | 'ELIMINADA'
export type EstadoReporte = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO'
export type MotivoReporte =
  | 'INFORMACION_FALSA'
  | 'CONTENIDO_INAPROPIADO'
  | 'SPAM'
  | 'DUPLICADA'
  | 'MASCOTA_YA_ENCONTRADA'
  | 'OTRO'

export interface Pagina<T> {
  items: T[]
  pagina: number
  tamano: number
  total: number
  hayMas: boolean
}

export interface UsuarioResumen {
  id: string
  nombre: string
  fotoUrl: string | null
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  fotoUrl: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiraEn: string
  usuario: Usuario
}

export interface PublicacionCard {
  id: string
  nombreMascota: string
  ubicacionTexto: string
  fechaPerdida: string
  estado: EstadoPublicacion
  imagenUrl: string | null
}

export interface Imagen {
  id: string
  url: string
  urlMiniatura: string
  orden: number
}

export interface PublicacionDetalle {
  id: string
  nombreMascota: string
  color: string
  tamano: Tamano
  edad: string | null
  castrado: boolean
  tieneCollar: boolean
  tieneChapitaQr: boolean
  descripcion: string | null
  fechaPerdida: string
  recompensa: number | null
  ubicacionTexto: string
  latitud: number
  longitud: number
  estado: EstadoPublicacion
  fechaCreacion: string
  imagenes: Imagen[]
  autor: UsuarioResumen
  esMia: boolean
  yaReportada: boolean
}

export interface MarcadorMapa {
  id: string
  nombreMascota: string
  miniaturaUrl: string | null
  latitud: number
  longitud: number
}

export interface Geocodificacion {
  direccion: string
  latitud: number
  longitud: number
}

export interface ConversacionResumen {
  id: string
  otro: UsuarioResumen
  publicacionId: string | null
  publicacionNombre: string | null
  ultimoMensaje: string | null
  ultimoMensajeEsImagen: boolean
  fechaUltimoMensaje: string | null
  noLeidos: number
}

export interface Mensaje {
  id: string
  conversacionId: string
  remitenteId: string
  contenido: string | null
  imagenUrl: string | null
  fechaEnvio: string
}

export interface HogarTransito {
  id: string
  nombre: string
  telefono: string
  email: string
  ciudad: string
  pais: string
  esMio: boolean
  fechaCreacion: string
}

export interface Refugio {
  id: string
  nombre: string | null
  direccion: string
  latitud: number
  longitud: number
  puedeEliminar: boolean
}

export interface Reporte {
  id: string
  publicacionId: string
  publicacionNombre: string
  publicacionImagenUrl: string | null
  publicacionEstado: EstadoPublicacion
  autorNombre: string
  reportadoPorNombre: string
  motivo: MotivoReporte
  comentario: string | null
  estado: EstadoReporte
  revisadoPorNombre: string | null
  notaRevision: string | null
  fechaCreacion: string
}

export interface AdminPublicacion {
  id: string
  nombreMascota: string
  ubicacionTexto: string
  imagenUrl: string | null
  estado: EstadoPublicacion
  autorNombre: string
  autorEmail: string
  reportesPendientes: number
  fechaCreacion: string
}

export interface UsuarioAdmin {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  fechaCreacion: string
}

export const MOTIVOS_REPORTE: Record<MotivoReporte, string> = {
  INFORMACION_FALSA: 'Información falsa',
  CONTENIDO_INAPROPIADO: 'Contenido inapropiado',
  SPAM: 'Spam',
  DUPLICADA: 'Publicación duplicada',
  MASCOTA_YA_ENCONTRADA: 'La mascota ya fue encontrada',
  OTRO: 'Otro',
}

export const TAMANOS: Record<Tamano, string> = {
  GRANDE: 'Grande',
  MEDIANO: 'Mediano',
  PEQUENO: 'Pequeño',
}
