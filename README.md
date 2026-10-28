# Animal Rescue — app móvil (React Native + Expo)

App para Android e iOS hecha con Expo SDK 58 y expo-router. Se prueba en el teléfono con **Expo Go**, sin Android Studio ni Xcode.

## Requisitos

- Teléfono con **Expo Go** (Play Store / App Store) en la **misma red Wi-Fi** que la PC.
- Backend corriendo y escuchando en la red (`http://0.0.0.0:5080`, ya configurado en `launchSettings.json`).
- Firewall de Windows con los puertos **5080** (API) y **8081** (Expo) abiertos. En PowerShell **como administrador**:

  ```powershell
  New-NetFirewallRule -DisplayName "Animal Rescue API" -Direction Inbound -Protocol TCP -LocalPort 5080 -Action Allow -Profile Private,Public
  New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private,Public
  ```

## Ejecutar

1. Backend (desde `AnimalRescue-main`):

   ```bash
   dotnet run --project Animal-Rescue-App/AnimalRescue.API
   ```

2. App (desde esta carpeta):

   ```bash
   npm install
   npx expo start
   ```

3. Escanea el QR con Expo Go (Android) o con la cámara (iPhone).

La app usa automáticamente la IP de la PC que muestra el QR, con el puerto 5080. Si el backend está en otra
dirección, crea un archivo `.env` con `EXPO_PUBLIC_API_URL=http://IP:5080` y reinicia `npx expo start`.
La dirección en uso se ve al final de **Mi cuenta**.

Si la red no deja conectar el teléfono con la PC (redes de universidad, empresa, etc.), usa `npx expo start --tunnel`
para Expo y publica la API con una URL accesible (por ejemplo un túnel) en `EXPO_PUBLIC_API_URL`.

## Estructura

```
src/
├── app/                    ← pantallas (expo-router: cada archivo es una ruta)
│   ├── (tabs)/             ← Inicio, Mapa, Publicar, Mensajes, Rescue
│   ├── publicacion/[id]/   ← detalle y edición
│   ├── chat/[id].tsx       ← conversación
│   ├── mis-mascotas.tsx, cuenta.tsx, login.tsx, registro.tsx
│   └── admin/              ← reportes, publicaciones, administradores
├── api/                    ← cliente HTTP (fetch + renovación de token) y endpoints
├── features/               ← componentes por módulo (formulario, mapa, rescue, mensajes…)
├── components/             ← UI común (botones, campos, hojas, avisos)
├── store/auth.ts           ← sesión (tokens guardados con expo-secure-store)
├── lib/                    ← tema, configuración, formatos
└── types/api.ts            ← DTOs del backend
```

## Mapas

Los mapas usan **Leaflet + OpenStreetMap** (gratis, sin clave de API) dentro de `react-native-webview`, así que
funcionan en Expo Go y en los builds de Android/iOS sin configurar Google Maps. El componente está en
`src/features/mapa/Mapa.tsx` y el proveedor de teselas en `MAPA_TESELAS` (`src/lib/config.ts`). Las teselas de
OpenStreetMap tienen una [política de uso justo](https://operations.osmfoundation.org/policies/tiles/): para mucho
tráfico conviene cambiar esa URL por un proveedor propio.

## Cómo se resolvieron las interacciones del enunciado

- **Mapa:** un toque en la patita muestra la miniatura (foto + nombre) abajo; dos toques seguidos abren la
  publicación; tocar el mapa fuera de la miniatura la cierra.
- **Refugios:** mantener presionado el ícono de un refugio que agregaste pide confirmación (Sí / No) para eliminarlo;
  un toque muestra su nombre y dirección.
- **Publicar:** al escribir la dirección el mapa se mueve solo (búsqueda con 0,7 s de espera); la patita se puede
  arrastrar o se puede tocar el mapa para corregirla. Fotos desde la galería o la cámara.
- **Mensajes:** tiempo real con SignalR; la "X" de cada chat lo elimina de tu lista.

## Verificación

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Publicar en las tiendas

Con EAS Build (en la nube): `npx eas-cli@latest build -p android`. Los mapas no necesitan clave de API.
