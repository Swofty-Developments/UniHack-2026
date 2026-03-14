import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../backend/src/trpc/appRouter';

export const trpc = createTRPCReact<AppRouter>();
