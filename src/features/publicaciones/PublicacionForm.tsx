import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { z } from 'zod'
import { publicacionesApi } from '../../api/endpoints'
import { archivoForm, mensajeError } from '../../api/http'
import { Button } from '../../components/Button'
import { CheckRow, DateField, Seccion, SelectField, TextField } from '../../components/Fields'
import { hoyISO } from '../../lib/format'
import { anchoMaximo, centrado } from '../../lib/theme'
import { toast } from '../../lib/toast'
import { TAMANOS, type PublicacionDetalle, type Tamano } from '../../types/api'
import { SelectorUbicacion } from './SelectorUbicacion'
import { MAX_IMAGENES, SubidorImagenes, type FotoLocal } from './SubidorImagenes'

const schema = z.object({
  nombreMascota: z.string().trim().min(1, 'Ingresa el nombre').max(80, 'Máximo 80 caracteres'),
  color: z.string().trim().min(1, 'Ingresa el color').max(60, 'Máximo 60 caracteres'),
  tamano: z.string().min(1, 'Selecciona el tamaño'),
  edad: z.string().trim().max(30, 'Máximo 30 caracteres'),
  castrado: z.string().min(1, 'Selecciona una opción'),
  tieneCollar: z.boolean(),
  tieneChapitaQr: z.boolean(),
  descripcion: z.string().max(2000, 'Máximo 2000 caracteres'),
  fechaPerdida: z.string().min(1, 'Indica la fecha').refine((f) => f <= hoyISO(), 'La fecha no puede ser futura'),
  recompensa: z.string().refine((v) => !v.trim() || (Number.isFinite(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) >= 0), 'Ingresa un monto válido'),
  ubicacionTexto: z.string().trim().min(3, 'Indica dónde se perdió').max(300, 'Máximo 300 caracteres'),
  estado: z.enum(['ACTIVA', 'ENCONTRADA']),
})
type Valores = z.infer<typeof schema>

const OPCIONES_TAMANO = Object.entries(TAMANOS).map(([valor, texto]) => ({ valor: valor as Tamano, texto }))
const OPCIONES_SINO = [
  { valor: 'true' as const, texto: 'Sí' },
  { valor: 'false' as const, texto: 'No' },
]
const OPCIONES_ESTADO = [
  { valor: 'ACTIVA' as const, texto: 'Sigue perdida' },
  { valor: 'ENCONTRADA' as const, texto: '¡Ya la encontramos!' },
]

function valoresIniciales(p?: PublicacionDetalle): Valores {
  if (!p)
    return {
      nombreMascota: '', color: '', tamano: '', edad: '', castrado: '', tieneCollar: false, tieneChapitaQr: false,
      descripcion: '', fechaPerdida: hoyISO(), recompensa: '', ubicacionTexto: '', estado: 'ACTIVA',
    }
  return {
    nombreMascota: p.nombreMascota,
    color: p.color,
    tamano: p.tamano,
    edad: p.edad ?? '',
    castrado: String(p.castrado),
    tieneCollar: p.tieneCollar,
    tieneChapitaQr: p.tieneChapitaQr,
    descripcion: p.descripcion ?? '',
    fechaPerdida: p.fechaPerdida,
    recompensa: p.recompensa !== null ? String(p.recompensa) : '',
    ubicacionTexto: p.ubicacionTexto,
    estado: p.estado === 'ENCONTRADA' ? 'ENCONTRADA' : 'ACTIVA',
  }
}

/** Formulario de mascota perdida; sin `existente` crea, con `existente` edita. */
export function PublicacionForm({ existente }: { existente?: PublicacionDetalle }) {
  const edicion = !!existente
  const queryClient = useQueryClient()
  const { control, handleSubmit, reset, formState: { errors } } = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: valoresIniciales(existente),
  })

  const [punto, setPunto] = useState(existente ? { lat: existente.latitud, lng: existente.longitud } : null)
  const [nuevas, setNuevas] = useState<FotoLocal[]>([])
  const [eliminadas, setEliminadas] = useState<string[]>([])
  const [errorImagenes, setErrorImagenes] = useState<string>()
  const [errorUbicacion, setErrorUbicacion] = useState<string>()

  const guardar = useMutation({
    mutationFn: (v: Valores) => {
      const f = new FormData()
      f.append('nombreMascota', v.nombreMascota.trim())
      f.append('color', v.color.trim())
      f.append('tamano', v.tamano)
      if (v.edad.trim()) f.append('edad', v.edad.trim())
      f.append('castrado', v.castrado)
      f.append('tieneCollar', String(v.tieneCollar))
      f.append('tieneChapitaQr', String(v.tieneChapitaQr))
      if (v.descripcion.trim()) f.append('descripcion', v.descripcion.trim())
      f.append('fechaPerdida', v.fechaPerdida)
      if (v.recompensa.trim()) f.append('recompensa', v.recompensa.trim().replace(',', '.'))
      f.append('ubicacionTexto', v.ubicacionTexto.trim())
      f.append('latitud', String(punto!.lat))
      f.append('longitud', String(punto!.lng))

      const campoFotos = edicion ? 'nuevasImagenes' : 'imagenes'
      nuevas.forEach((foto) => f.append(campoFotos, archivoForm(foto)))
      if (!edicion) return publicacionesApi.crear(f)

      f.append('estado', v.estado)
      eliminadas.forEach((id) => f.append('eliminarImagenIds', id))
      return publicacionesApi.editar(existente.id, f)
    },
    onSuccess: (guardada) => {
      toast.ok(edicion ? 'Publicación actualizada' : '¡Publicación creada! Ojalá aparezca pronto.')
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
      void queryClient.invalidateQueries({ queryKey: ['mias'] })
      void queryClient.invalidateQueries({ queryKey: ['mapa'] })
      void queryClient.invalidateQueries({ queryKey: ['publicacion', guardada.id] })
      if (edicion) {
        router.back()
      } else {
        // Se limpia el formulario de la pestaña para la próxima publicación.
        reset(valoresIniciales())
        setPunto(null)
        setNuevas([])
        router.push(`/publicacion/${guardada.id}`)
      }
    },
    onError: (e) => toast.error(mensajeError(e)),
  })

  const enviar = handleSubmit((v) => {
    const imagenes = (existente?.imagenes.length ?? 0) - eliminadas.length + nuevas.length
    setErrorImagenes(imagenes < 1 ? 'Sube al menos una foto de la mascota.' : undefined)
    setErrorUbicacion(punto ? undefined : 'Escribe una dirección válida o marca el punto en el mapa.')
    if (imagenes < 1 || !punto) return
    guardar.mutate(v)
  })

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Seccion>
          <Controller control={control} name="nombreMascota" render={({ field }) => (
            <TextField etiqueta="Nombre de la mascota" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.nombreMascota?.message} />
          )} />
          <Controller control={control} name="color" render={({ field }) => (
            <TextField etiqueta="Color" placeholder="Ej: marrón con manchas blancas" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.color?.message} />
          )} />
          <View style={estilos.fila}>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="tamano" render={({ field }) => (
                <SelectField etiqueta="Tamaño" valor={field.value as Tamano | ''} opciones={OPCIONES_TAMANO} onCambiar={field.onChange} error={errors.tamano?.message} />
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="edad" render={({ field }) => (
                <TextField etiqueta="Edad" placeholder="Ej: 3 años" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.edad?.message} />
              )} />
            </View>
          </View>
          <Controller control={control} name="castrado" render={({ field }) => (
            <SelectField etiqueta="Castrado/a" valor={field.value as 'true' | 'false' | ''} opciones={OPCIONES_SINO} onCambiar={field.onChange} error={errors.castrado?.message} />
          )} />
          <Controller control={control} name="tieneCollar" render={({ field }) => (
            <CheckRow etiqueta="Tiene collar" valor={field.value} onCambiar={field.onChange} />
          )} />
          <Controller control={control} name="tieneChapitaQr" render={({ field }) => (
            <CheckRow etiqueta="Tiene chapita QR" valor={field.value} onCambiar={field.onChange} />
          )} />
          <Controller control={control} name="descripcion" render={({ field }) => (
            <TextField etiqueta="Descripción" opcional multiline placeholder="Señas particulares, carácter, cómo se perdió…" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.descripcion?.message} />
          )} />
          <Controller control={control} name="fechaPerdida" render={({ field }) => (
            <DateField etiqueta="Fecha en que se perdió" valor={field.value} onCambiar={field.onChange} error={errors.fechaPerdida?.message} />
          )} />
          <Controller control={control} name="recompensa" render={({ field }) => (
            <TextField etiqueta="Recompensa" opcional keyboardType="decimal-pad" placeholder="Monto ofrecido" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.recompensa?.message} />
          )} />
          {edicion && (
            <Controller control={control} name="estado" render={({ field }) => (
              <SelectField etiqueta="Estado" valor={field.value} opciones={OPCIONES_ESTADO} onCambiar={field.onChange} />
            )} />
          )}
        </Seccion>

        <Seccion>
          <Controller control={control} name="ubicacionTexto" render={({ field }) => (
            <SelectorUbicacion
              texto={field.value}
              onTexto={field.onChange}
              punto={punto}
              onPunto={(lat, lng) => {
                setPunto({ lat, lng })
                setErrorUbicacion(undefined)
              }}
              textoConocido={existente?.ubicacionTexto}
              error={errors.ubicacionTexto?.message ?? errorUbicacion}
            />
          )} />
        </Seccion>

        <Seccion>
          <SubidorImagenes
            existentes={existente?.imagenes}
            eliminadas={eliminadas}
            nuevas={nuevas}
            error={errorImagenes}
            onToggleExistente={(id) => setEliminadas((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))}
            onNuevas={(f) => {
              setNuevas(f.slice(0, MAX_IMAGENES))
              setErrorImagenes(undefined)
            }}
          />
        </Seccion>

        <Button cargando={guardar.isPending} onPress={enviar}>
          {edicion ? 'Guardar cambios' : 'Publicar'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const estilos = StyleSheet.create({
  contenedor: { padding: 16, gap: 16, paddingBottom: 40, ...centrado(anchoMaximo.contenido) },
  fila: { flexDirection: 'row', gap: 12 },
})
