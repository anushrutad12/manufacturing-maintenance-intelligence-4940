import { QueryClient } from "@tanstack/react-query";

/**
 * PUBLIC_INTERFACE
 * Create a preconfigured QueryClient instance.
 */
export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 15_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
