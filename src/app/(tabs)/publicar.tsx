import { RequiereSesion } from '../../features/cuenta/RequiereSesion'
import { PublicacionForm } from '../../features/publicaciones/PublicacionForm'

export default function PublicarScreen() {
  return (
    <RequiereSesion icono="paw-outline" titulo="Inicia sesión para publicar" texto="Necesitamos saber quién publica para que puedan contactarte.">
      <PublicacionForm />
    </RequiereSesion>
  )
}
