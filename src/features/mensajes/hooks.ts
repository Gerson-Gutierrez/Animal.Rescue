import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { mensajesApi } from '../../api/endpoints'
import { API_URL } from '../../lib/config'
import { useAuthStore } from '../../store/auth'
import type { Mensaje } from '../../types/api'

/** Lista de chats; la comparten la pestaña Mensajes y el contador de no leídos. */
export function useConversaciones() {
  const autenticado = useAuthStore((s) => !!s.usuario)
  return useQuery({
    queryKey: ['conversaciones'],
    queryFn: mensajesApi.listar,
    enabled: autenticado,
    refetchInterval: 60_000,
  })
}

export function useNoLeidos(): number {
  const { data } = useConversaciones()
  return data?.reduce((total, c) => total + c.noLeidos, 0) ?? 0
}

/** Mantiene abierta la conexión SignalR y vuelca los mensajes recibidos en la caché. */
export function useChatRealtime() {
  const queryClient = useQueryClient()
  const usuarioId = useAuthStore((s) => s.usuario?.id)

  useEffect(() => {
    if (!usuarioId) return
    const conexion = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/chat`, { accessTokenFactory: () => useAuthStore.getState().accessToken ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()

    conexion.on('MensajeRecibido', (m: Mensaje) => {
      queryClient.setQueryData<Mensaje[]>(['mensajes', m.conversacionId], (previos) =>
        previos && !previos.some((x) => x.id === m.id) ? [...previos, m] : previos,
      )
      void queryClient.invalidateQueries({ queryKey: ['conversaciones'] })
    })

    let activo = true
    let reintento: ReturnType<typeof setTimeout> | undefined
    const iniciar = () =>
      conexion.start().catch(() => {
        // Sin conexión con el servidor: se reintenta con espera.
        if (activo) reintento = setTimeout(iniciar, 5000)
      })
    const arranque = setTimeout(iniciar, 0)

    return () => {
      activo = false
      clearTimeout(arranque)
      clearTimeout(reintento)
      void conexion.stop()
    }
  }, [usuarioId, queryClient])
}
