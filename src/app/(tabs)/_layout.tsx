import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Tabs } from 'expo-router/js-tabs'
import { Pressable, StyleSheet, View } from 'react-native'
import { FondoPatitas } from '../../components/FondoPatitas'
import { estiloFuente } from '../../components/Texto'
import { Avatar } from '../../components/Ui'
import { useNoLeidos } from '../../features/mensajes/hooks'
import { colores } from '../../lib/theme'
import { useAuthStore } from '../../store/auth'

/** Accesos de la cabecera: Mis mascotas y Mi cuenta. */
function AccionesCabecera() {
  const usuario = useAuthStore((s) => s.usuario)
  return (
    <View style={estilos.acciones}>
      {usuario && (
        <Pressable onPress={() => router.push('/mis-mascotas')} hitSlop={8} accessibilityLabel="Mis mascotas" style={estilos.boton}>
          <Ionicons name="paw-outline" size={22} color={colores.textoSuave} />
        </Pressable>
      )}
      <Pressable
        onPress={() => router.push(usuario ? '/cuenta' : '/login')}
        hitSlop={8}
        accessibilityLabel={usuario ? 'Mi cuenta' : 'Iniciar sesión'}
        style={estilos.boton}
      >
        {usuario ? <Avatar nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} tam={30} /> : <Ionicons name="person-circle-outline" size={28} color={colores.textoSuave} />}
      </Pressable>
    </View>
  )
}

export default function TabsLayout() {
  const noLeidos = useNoLeidos()
  return (
    <Tabs
      // Cada pestaña lleva su propio fondo opaco: las pestañas visitadas siguen montadas detrás
      // (en web, con z-index -1) y con un fondo transparente se verían a través de la activa.
      screenLayout={({ children }) => <FondoPatitas>{children}</FondoPatitas>}
      screenOptions={{
        tabBarActiveTintColor: colores.marcaOscuro,
        tabBarInactiveTintColor: colores.textoTenue,
        tabBarLabelStyle: { ...estiloFuente('600'), fontSize: 11 },
        headerTitleStyle: { ...estiloFuente('700'), color: colores.texto },
        headerRight: () => <AccionesCabecera />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Animal Rescue',
          headerTitleStyle: { ...estiloFuente('700'), color: colores.marcaOscuro },
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{ title: 'Mapa', tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="publicar"
        options={{
          title: 'Publicar mascota perdida',
          tabBarLabel: 'Publicar',
          tabBarIcon: () => (
            <View style={estilos.central}>
              <Ionicons name="add" size={30} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{
          title: 'Mensajes',
          tabBarBadge: noLeidos > 0 ? (noLeidos > 9 ? '9+' : noLeidos) : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rescue"
        options={{ title: 'Rescue', tabBarIcon: ({ color, size }) => <Ionicons name="heart-circle" color={color as string} size={size + 2} /> }}
      />
    </Tabs>
  )
}

const estilos = StyleSheet.create({
  acciones: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 12 },
  boton: { padding: 6 },
  central: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: -18,
    backgroundColor: colores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
})
