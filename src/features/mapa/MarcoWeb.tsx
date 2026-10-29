import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'

/**
 * Equivalente web del WebView del mapa: un iframe con el mismo HTML.
 * El iframe avisa con `window.parent.postMessage` y la app le inyecta código con `eval`
 * (srcdoc comparte origen con la página, así que se puede acceder a su `window`).
 */

export interface MarcoWebRef {
  injectJavaScript: (codigo: string) => void
}

interface Props {
  ref?: Ref<MarcoWebRef>
  html: string
  onMessage: (e: { nativeEvent: { data: string } }) => void
}

type VentanaConEval = Window & { eval: (codigo: string) => unknown }

export function MarcoWeb({ ref, html, onMessage }: Props) {
  const marco = useRef<HTMLIFrameElement>(null)
  const alMensaje = useRef(onMessage)

  useEffect(() => {
    alMensaje.current = onMessage
  })

  useImperativeHandle(ref, () => ({
    injectJavaScript: (codigo) => {
      ;(marco.current?.contentWindow as VentanaConEval | null)?.eval(codigo)
    },
  }), [])

  useEffect(() => {
    const escuchar = (e: MessageEvent) => {
      if (e.source === marco.current?.contentWindow && typeof e.data === 'string')
        alMensaje.current({ nativeEvent: { data: e.data } })
    }
    window.addEventListener('message', escuchar)
    return () => window.removeEventListener('message', escuchar)
  }, [])

  // Los enlaces (atribución de OpenStreetMap) se abren en otra pestaña, no dentro del mapa.
  const alCargar = () => {
    const doc = marco.current?.contentDocument
    if (!doc || doc.querySelector('base')) return
    const base = doc.createElement('base')
    base.target = '_blank'
    doc.head.appendChild(base)
  }

  return (
    <iframe
      ref={marco}
      srcDoc={html}
      onLoad={alCargar}
      title="Mapa"
      style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}
