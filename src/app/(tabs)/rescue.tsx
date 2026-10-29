import { useState } from 'react'
import { View } from 'react-native'
import { Segmentado } from '../../components/Ui'
import { anchoMaximo, centrado } from '../../lib/theme'
import { Hogares } from '../../features/rescue/Hogares'
import { Refugios } from '../../features/rescue/Refugios'

type Pestana = 'hogares' | 'refugios'

export default function RescueScreen() {
  const [pestana, setPestana] = useState<Pestana>('hogares')
  return (
    <View style={{ flex: 1, padding: 12, gap: 12, ...centrado(anchoMaximo.contenido) }}>
      <Segmentado
        valor={pestana}
        onCambiar={setPestana}
        opciones={[
          { id: 'hogares', texto: 'Hogares de tránsito' },
          { id: 'refugios', texto: 'Refugios' },
        ]}
      />
      {pestana === 'hogares' ? <Hogares /> : <Refugios />}
    </View>
  )
}
