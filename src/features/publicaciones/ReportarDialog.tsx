import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { View } from 'react-native'
import { publicacionesApi } from '../../api/endpoints'
import { Button } from '../../components/Button'
import { SelectField, TextField } from '../../components/Fields'
import { Hoja } from '../../components/Modal'
import { toast } from '../../lib/toast'
import { MOTIVOS_REPORTE, type MotivoReporte } from '../../types/api'

const OPCIONES = Object.entries(MOTIVOS_REPORTE).map(([valor, texto]) => ({ valor: valor as MotivoReporte, texto }))

export function ReportarDialog({ publicacionId, abierto, onCerrar }: { publicacionId: string; abierto: boolean; onCerrar: () => void }) {
  const queryClient = useQueryClient()
  const [motivo, setMotivo] = useState<MotivoReporte>('INFORMACION_FALSA')
  const [comentario, setComentario] = useState('')

  const reportar = useMutation({
    mutationFn: () => publicacionesApi.reportar(publicacionId, { motivo, comentario: comentario.trim() || undefined }),
    onSuccess: () => {
      toast.ok('Gracias, revisaremos la publicación.')
      void queryClient.invalidateQueries({ queryKey: ['publicacion', publicacionId] })
      setComentario('')
      onCerrar()
    },
  })

  return (
    <Hoja abierto={abierto} titulo="Reportar publicación" onCerrar={onCerrar}>
      <View style={{ gap: 16 }}>
        <SelectField etiqueta="Motivo" valor={motivo} opciones={OPCIONES} onCambiar={setMotivo} />
        <TextField
          etiqueta="Comentario"
          opcional
          multiline
          maxLength={500}
          value={comentario}
          onChangeText={setComentario}
          placeholder="Cuéntanos qué está mal en esta publicación"
        />
        <Button cargando={reportar.isPending} onPress={() => reportar.mutate()}>
          Enviar reporte
        </Button>
      </View>
    </Hoja>
  )
}
