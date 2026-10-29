import { Ionicons } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FlatList, Linking, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../../components/Texto'
import { z } from 'zod'
import { rescueApi } from '../../api/endpoints'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Fields'
import { ConfirmDialog, Hoja } from '../../components/Modal'
import { Badge, Cargando, EmptyState, ErrorState } from '../../components/Ui'
import { colores, radio, sombra } from '../../lib/theme'
import { toast } from '../../lib/toast'
import { useAuthStore } from '../../store/auth'
import type { HogarTransito } from '../../types/api'
import { RequiereSesion } from '../cuenta/RequiereSesion'

const schema = z.object({
  nombre: z.string().trim().min(1, 'Ingresa tu nombre').max(100),
  telefono: z.string().trim().min(6, 'Ingresa un teléfono válido').max(30),
  email: z.string().trim().min(1, 'Ingresa tu correo').email('Correo no válido').max(254),
  ciudad: z.string().trim().min(1, 'Ingresa la ciudad').max(100),
  pais: z.string().trim().min(1, 'Ingresa el país').max(100),
})
type Datos = z.infer<typeof schema>

const CAMPOS: { nombre: keyof Datos; etiqueta: string; teclado?: 'phone-pad' | 'email-address' }[] = [
  { nombre: 'nombre', etiqueta: 'Nombre' },
  { nombre: 'telefono', etiqueta: 'Teléfono', teclado: 'phone-pad' },
  { nombre: 'email', etiqueta: 'Correo electrónico', teclado: 'email-address' },
  { nombre: 'ciudad', etiqueta: 'Ciudad' },
  { nombre: 'pais', etiqueta: 'País' },
]

function FormularioHogar({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const queryClient = useQueryClient()
  const usuario = useAuthStore((s) => s.usuario)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<Datos>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: usuario?.nombre ?? '', telefono: '', email: usuario?.email ?? '', ciudad: '', pais: '' },
  })

  const postular = useMutation({
    mutationFn: rescueApi.postular,
    onSuccess: () => {
      toast.ok('¡Gracias por ofrecer tu hogar!')
      void queryClient.invalidateQueries({ queryKey: ['hogares'] })
      reset()
      onCerrar()
    },
  })

  return (
    <Hoja abierto={abierto} titulo="Ser hogar de tránsito" onCerrar={onCerrar}>
      <View style={{ gap: 14 }}>
        {CAMPOS.map((c) => (
          <Controller
            key={c.nombre}
            control={control}
            name={c.nombre}
            render={({ field }) => (
              <TextField
                etiqueta={c.etiqueta}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType={c.teclado}
                autoCapitalize={c.teclado === 'email-address' ? 'none' : 'sentences'}
                error={errors[c.nombre]?.message}
              />
            )}
          />
        ))}
        <Button cargando={postular.isPending} onPress={handleSubmit((d) => postular.mutate(d))}>
          Registrarme
        </Button>
      </View>
    </Hoja>
  )
}

function HogarCard({ h }: { h: HogarTransito }) {
  return (
    <View style={[estilos.card, h.esMio && estilos.cardMia]}>
      <View style={estilos.cabecera}>
        <Text style={estilos.nombre} numberOfLines={1}>{h.nombre}</Text>
        {h.esMio && <Badge color="orange">Tu postulación</Badge>}
      </View>
      <View style={estilos.linea}>
        <Ionicons name="location" size={16} color={colores.marca} />
        <Text style={estilos.texto}>{h.ciudad}, {h.pais}</Text>
      </View>
      <Pressable style={estilos.linea} onPress={() => void Linking.openURL(`tel:${h.telefono}`)}>
        <Ionicons name="call" size={16} color={colores.marca} />
        <Text style={[estilos.texto, estilos.enlace]}>{h.telefono}</Text>
      </Pressable>
      <Pressable style={estilos.linea} onPress={() => void Linking.openURL(`mailto:${h.email}`)}>
        <Ionicons name="mail" size={16} color={colores.marca} />
        <Text style={[estilos.texto, estilos.enlace]} numberOfLines={1}>{h.email}</Text>
      </Pressable>
    </View>
  )
}

function ListaHogares() {
  const queryClient = useQueryClient()
  const [formAbierto, setFormAbierto] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const hogares = useQuery({ queryKey: ['hogares'], queryFn: rescueApi.hogares })
  const mio = hogares.data?.find((h) => h.esMio)

  const eliminar = useMutation({
    mutationFn: rescueApi.eliminarMiHogar,
    onSuccess: () => {
      toast.ok('Tu postulación fue eliminada')
      setConfirmando(false)
      void queryClient.invalidateQueries({ queryKey: ['hogares'] })
    },
  })

  return (
    <>
      <FlatList
        data={hogares.data ?? []}
        keyExtractor={(h) => h.id}
        renderItem={({ item }) => <HogarCard h={item} />}
        contentContainerStyle={{ gap: 12, paddingBottom: 24, flexGrow: 1 }}
        onRefresh={() => void hogares.refetch()}
        refreshing={hogares.isRefetching}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Text style={estilos.intro}>Personas dispuestas a dar alojamiento temporal a perros rescatados.</Text>
            {mio ? (
              <Button variante="secundario" icono="trash-outline" onPress={() => setConfirmando(true)}>Eliminar mi postulación</Button>
            ) : (
              <Button icono="add" deshabilitado={!hogares.isSuccess} onPress={() => setFormAbierto(true)}>Quiero ser hogar de tránsito</Button>
            )}
          </View>
        }
        ListEmptyComponent={
          hogares.isPending ? <Cargando /> : hogares.isError ? <ErrorState onReintentar={() => void hogares.refetch()} /> : (
            <EmptyState icono="home-outline" titulo="Aún no hay hogares" texto="Sé la primera persona en ofrecer su casa." />
          )
        }
      />
      <FormularioHogar abierto={formAbierto} onCerrar={() => setFormAbierto(false)} />
      <ConfirmDialog
        abierto={confirmando}
        titulo="Eliminar postulación"
        mensaje="Tu tarjeta dejará de mostrarse. Podrás volver a postularte cuando quieras."
        cargando={eliminar.isPending}
        onSi={() => eliminar.mutate()}
        onNo={() => setConfirmando(false)}
      />
    </>
  )
}

export function Hogares() {
  return (
    <RequiereSesion icono="home-outline" titulo="Inicia sesión para ver los hogares" texto="Los datos de contacto sólo están disponibles para usuarios registrados.">
      <ListaHogares />
    </RequiereSesion>
  )
}

const estilos = StyleSheet.create({
  intro: { fontSize: 14, color: colores.textoSuave },
  card: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: 16, gap: 8, ...sombra },
  cardMia: { borderWidth: 2, borderColor: colores.marcaClaro },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nombre: { fontSize: 17, fontWeight: '800', color: colores.texto, flex: 1 },
  linea: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  texto: { fontSize: 15, color: colores.textoSuave, flexShrink: 1 },
  enlace: { textDecorationLine: 'underline' },
})
