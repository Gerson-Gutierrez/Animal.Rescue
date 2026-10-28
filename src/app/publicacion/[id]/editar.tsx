import { useQuery } from '@tanstack/react-query'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { publicacionesApi } from '../../../api/endpoints'
import { Cargando, ErrorState } from '../../../components/Ui'
import { PublicacionForm } from '../../../features/publicaciones/PublicacionForm'
import { useAuthStore } from '../../../store/auth'

export default function EditarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const autenticado = useAuthStore((s) => !!s.usuario)
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['publicacion', id, true],
    queryFn: () => publicacionesApi.detalle(id),
    enabled: autenticado,
  })

  if (!autenticado) return <Redirect href="/login" />
  if (isPending) return <Cargando />
  if (isError || !data) return <ErrorState onReintentar={() => void refetch()} />
  if (!data.esMia) return <Redirect href={`/publicacion/${id}`} />
  return <PublicacionForm existente={data} />
}
