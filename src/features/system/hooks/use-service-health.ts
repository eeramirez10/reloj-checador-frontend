import { useQuery } from '@tanstack/react-query'
import { getServiceHealth, serviceHealthQueryKey } from '../api/system.api'

export function useServiceHealth() {
  return useQuery({
    queryKey: serviceHealthQueryKey,
    queryFn: ({ signal }) => getServiceHealth(signal),
    refetchInterval: 30_000,
    retry: false,
  })
}
