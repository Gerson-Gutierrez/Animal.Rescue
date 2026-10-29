import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useState, type ReactNode } from 'react'
import { Platform, Pressable, StyleSheet, View, type TextInputProps } from 'react-native'
import { Text, TextInput } from './Texto'
import { formatFecha, hoyISO } from '../lib/format'
import { colores, radio } from '../lib/theme'
import { Hoja } from './Modal'

interface Envoltorio {
  etiqueta: string
  error?: string
  ayuda?: string
  opcional?: boolean
}

function Etiqueta({ etiqueta, opcional }: { etiqueta: string; opcional?: boolean }) {
  return (
    <Text style={estilos.etiqueta}>
      {etiqueta}
      {opcional && <Text style={estilos.opcional}> (opcional)</Text>}
    </Text>
  )
}

function Pie({ error, ayuda }: { error?: string; ayuda?: string }) {
  if (error) return <Text style={estilos.error}>{error}</Text>
  if (ayuda) return <Text style={estilos.ayuda}>{ayuda}</Text>
  return null
}

export function TextField({ etiqueta, error, ayuda, opcional, style, multiline, secureTextEntry, ...rest }: Envoltorio & TextInputProps) {
  const [visible, setVisible] = useState(false)
  const input = (
    <TextInput
      accessibilityLabel={etiqueta}
      placeholderTextColor={colores.textoTenue}
      multiline={multiline}
      secureTextEntry={secureTextEntry && !visible}
      style={[estilos.input, multiline && estilos.multilinea, secureTextEntry && estilos.inputConBoton, error ? estilos.inputError : null, style]}
      {...rest}
    />
  )
  return (
    <View style={estilos.campo}>
      <Etiqueta etiqueta={etiqueta} opcional={opcional} />
      {secureTextEntry ? (
        <View>
          {input}
          {/* Botón para mostrar u ocultar la contraseña. */}
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            style={estilos.ojo}
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colores.textoTenue} />
          </Pressable>
        </View>
      ) : (
        input
      )}
      <Pie error={error} ayuda={ayuda} />
    </View>
  )
}

interface Opcion<T extends string> {
  valor: T
  texto: string
}

interface SelectProps<T extends string> extends Envoltorio {
  valor: T | ''
  opciones: Opcion<T>[]
  onCambiar: (v: T) => void
  placeholder?: string
}

/** Desplegable: abre una lista de opciones en una hoja inferior. */
export function SelectField<T extends string>({ etiqueta, error, ayuda, opcional, valor, opciones, onCambiar, placeholder = 'Selecciona' }: SelectProps<T>) {
  const [abierto, setAbierto] = useState(false)
  const actual = opciones.find((o) => o.valor === valor)
  return (
    <View style={estilos.campo}>
      <Etiqueta etiqueta={etiqueta} opcional={opcional} />
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${etiqueta}: ${actual?.texto ?? placeholder}`}
        style={[estilos.input, estilos.fila, error ? estilos.inputError : null]}
      >
        <Text style={[estilos.valor, !actual && { color: colores.textoTenue }]}>{actual?.texto ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={colores.textoTenue} />
      </Pressable>
      <Pie error={error} ayuda={ayuda} />
      <Hoja abierto={abierto} titulo={etiqueta} onCerrar={() => setAbierto(false)}>
        {opciones.map((o) => (
          <Pressable
            key={o.valor}
            onPress={() => {
              onCambiar(o.valor)
              setAbierto(false)
            }}
            style={({ pressed }) => [estilos.opcion, pressed && { backgroundColor: colores.marcaFondo }]}
          >
            <Text style={[estilos.valor, o.valor === valor && { color: colores.marcaOscuro, fontWeight: '700' }]}>{o.texto}</Text>
            {o.valor === valor && <Ionicons name="checkmark" size={20} color={colores.marcaOscuro} />}
          </Pressable>
        ))}
      </Hoja>
    </View>
  )
}

/** Casilla marcable (por ejemplo "Tiene collar"). */
export function CheckRow({ etiqueta, valor, onCambiar }: { etiqueta: string; valor: boolean; onCambiar: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onCambiar(!valor)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: valor }}
      style={[estilos.check, valor && estilos.checkActivo]}
    >
      <Ionicons name={valor ? 'checkbox' : 'square-outline'} size={24} color={valor ? colores.marca : colores.textoTenue} />
      <Text style={estilos.valor}>{etiqueta}</Text>
    </Pressable>
  )
}

/** Selector de fecha (YYYY-MM-DD) que no permite fechas futuras. */
export function DateField({ etiqueta, error, valor, onCambiar }: Envoltorio & { valor: string; onCambiar: (v: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const fecha = valor ? new Date(`${valor}T12:00:00`) : new Date()
  const elegir = (d?: Date) => {
    if (!d) return
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    onCambiar(iso)
  }
  return (
    <View style={estilos.campo}>
      <Etiqueta etiqueta={etiqueta} />
      <Pressable onPress={() => setAbierto(true)} accessibilityRole="button" style={[estilos.input, estilos.fila, error ? estilos.inputError : null]}>
        <Text style={estilos.valor}>{valor ? formatFecha(valor) : 'Selecciona la fecha'}</Text>
        <Ionicons name="calendar-outline" size={18} color={colores.textoTenue} />
      </Pressable>
      <Pie error={error} />
      {abierto && (
        <DateTimePicker
          value={fecha}
          mode="date"
          maximumDate={new Date(`${hoyISO()}T23:59:59`)}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(evento, d) => {
            if (Platform.OS === 'android') setAbierto(false)
            if (evento.type === 'set') elegir(d)
          }}
        />
      )}
      {abierto && Platform.OS === 'ios' && (
        <Pressable onPress={() => setAbierto(false)} style={estilos.listo}>
          <Text style={{ color: colores.marcaOscuro, fontWeight: '700' }}>Listo</Text>
        </Pressable>
      )}
    </View>
  )
}

export function Seccion({ children }: { children: ReactNode }) {
  return <View style={estilos.seccion}>{children}</View>
}

const estilos = StyleSheet.create({
  campo: { gap: 6 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.textoSuave },
  opcional: { fontWeight: '400', color: colores.textoTenue },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.md,
    backgroundColor: colores.tarjeta,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colores.texto,
  },
  multilinea: { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' },
  inputError: { borderColor: colores.peligro },
  inputConBoton: { paddingRight: 48 },
  ojo: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, alignItems: 'center', justifyContent: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  valor: { fontSize: 16, color: colores.texto },
  error: { fontSize: 13, color: colores.peligro, fontWeight: '600' },
  ayuda: { fontSize: 13, color: colores.textoTenue },
  opcion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: radio.sm },
  check: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.md,
    paddingHorizontal: 12,
    backgroundColor: colores.tarjeta,
  },
  checkActivo: { borderColor: colores.marca, backgroundColor: colores.marcaFondo },
  listo: { alignSelf: 'flex-end', padding: 8 },
  seccion: { backgroundColor: colores.tarjeta, borderRadius: radio.lg, padding: 16, gap: 16 },
})
