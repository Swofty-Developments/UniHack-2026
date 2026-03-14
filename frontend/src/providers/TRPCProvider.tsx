import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { trpc } from '../utils/trpc';
import { useAuthStore } from '../stores/useAuthStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api';
const TRPC_URL = API_URL.replace(/\/api$/, '/trpc');

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: TRPC_URL,
          transformer: superjson,
          headers() {
            const token = useAuthStore.getState().token;
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
