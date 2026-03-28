import {
  useCallback,
  useEffect,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { getErrorMessage } from './errors'

interface AsyncDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
  setData: Dispatch<SetStateAction<T | null>>
  setError: Dispatch<SetStateAction<string | null>>
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  dependencies: DependencyList,
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1)
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const nextData = await loader()

        if (!isCancelled) {
          setData(nextData)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      isCancelled = true
    }
  }, [loader, reloadToken, ...dependencies])

  return {
    data,
    loading,
    error,
    reload,
    setData,
    setError,
  }
}
