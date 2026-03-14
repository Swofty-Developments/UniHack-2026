import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../../backend/src/trpc/appRouter';
import { useAuthStore } from '../stores/useAuthStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api';
const TRPC_URL = API_URL.replace(/\/api$/, '/trpc');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpcClient: any = createTRPCClient<AppRouter>({
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
});
