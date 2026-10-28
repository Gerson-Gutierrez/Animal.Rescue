import type {
  AdminPublicacion,
  AuthResponse,
  ConversacionResumen,
  EstadoPublicacion,
  EstadoReporte,
  Geocodificacion,
  HogarTransito,
  MarcadorMapa,
  Mensaje,
  MotivoReporte,
  Pagina,
  PublicacionCard,
  PublicacionDetalle,
  Refugio,
  Reporte,
  Rol,
  Usuario,
  UsuarioAdmin,
} from '../types/api'
import { http } from './http'

export interface Limites {
  norte: number
  sur: number
  este: number
  oeste: number
}

export const cuentaApi = {
  registro: (d: { nombre: string; email: string; password: string }) => http.post<AuthResponse>('/auth/registro', d),
  login: (d: { email: string; password: string }) => http.post<AuthResponse>('/auth/login', d),
  logout: (refreshToken: string) => http.post('/auth/logout', { refreshToken }),
  actualizarPerfil: (nombre: string) => http.put<Usuario>('/usuarios/me', { nombre }),
}

export const publicacionesApi = {
  feed: (pagina: number, q?: string) => http.get<Pagina<PublicacionCard>>('/publicaciones', { pagina, tamano: 12, q }),
  detalle: (id: string) => http.get<PublicacionDetalle>(`/publicaciones/${id}`),
  mias: () => http.get<PublicacionCard[]>('/publicaciones/mias'),
  mapa: (l?: Limites) => http.get<MarcadorMapa[]>('/publicaciones/mapa', l ? { ...l } : undefined),
  crear: (form: FormData) => http.postForm<PublicacionDetalle>('/publicaciones', form),
  editar: (id: string, form: FormData) => http.putForm<PublicacionDetalle>(`/publicaciones/${id}`, form),
  eliminar: (id: string) => http.delete(`/publicaciones/${id}`),
  reportar: (id: string, d: { motivo: MotivoReporte; comentario?: string }) => http.post(`/publicaciones/${id}/reportes`, d),
  geocodificar: (q: string) => http.get<Geocodificacion[]>('/geocodificacion', { q }),
}

export const mensajesApi = {
  listar: () => http.get<ConversacionResumen[]>('/conversaciones'),
  abrir: (d: { destinatarioId: string; publicacionId?: string }) => http.post<ConversacionResumen>('/conversaciones', d),
  mensajes: (id: string, antesDe?: string) => http.get<Mensaje[]>(`/conversaciones/${id}/mensajes`, { antesDe, limite: 30 }),
  enviar: (id: string, form: FormData) => http.postForm<Mensaje>(`/conversaciones/${id}/mensajes`, form),
  marcarLeida: (id: string) => http.post(`/conversaciones/${id}/leida`),
  eliminar: (id: string) => http.delete(`/conversaciones/${id}`),
}

export interface DatosHogar {
  nombre: string
  telefono: string
  email: string
  ciudad: string
  pais: string
}

export const rescueApi = {
  hogares: () => http.get<HogarTransito[]>('/hogares-transito'),
  postular: (d: DatosHogar) => http.post<HogarTransito>('/hogares-transito', d),
  eliminarMiHogar: () => http.delete('/hogares-transito/mio'),
  refugios: () => http.get<Refugio[]>('/refugios'),
  agregarRefugio: (direccion: string) => http.post<Refugio>('/refugios', { direccion }),
  eliminarRefugio: (id: string) => http.delete(`/refugios/${id}`),
}

export const adminApi = {
  reportes: (estado?: EstadoReporte) => http.get<Pagina<Reporte>>('/admin/reportes', { estado, tamano: 50 }),
  resolverReporte: (id: string, accion: 'ACEPTAR' | 'RECHAZAR', nota?: string) =>
    http.put<Reporte>(`/admin/reportes/${id}`, { accion, nota: nota || undefined }),
  publicaciones: (q?: string, estado?: EstadoPublicacion) =>
    http.get<Pagina<AdminPublicacion>>('/admin/publicaciones', { q, estado, tamano: 50 }),
  eliminarPublicacion: (id: string) => http.delete(`/admin/publicaciones/${id}`),
  usuarios: (q?: string) => http.get<Pagina<UsuarioAdmin>>('/admin/usuarios', { q, tamano: 50 }),
  cambiarRol: (id: string, rol: Extract<Rol, 'USUARIO' | 'ADMIN'>) => http.put<UsuarioAdmin>(`/admin/usuarios/${id}/rol`, { rol }),
}
