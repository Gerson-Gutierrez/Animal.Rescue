import { MutationCache, QueryClient } from '@tanstack/react-query'
import { mensajeError } from '../api/http'
import { toast } from './toast'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
  // Las mutaciones muestran su error como aviso, salvo que definan su propio onError.
  mutationCache: new MutationCache({
    onError: (error, _v, _c, mutation) => {
      if (!mutation.options.onError) toast.error(mensajeError(error))
    },
  }),
})
