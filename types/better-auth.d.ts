import 'better-auth';
import type { UserRole } from '@/lib/roles';

declare module 'better-auth' {
  interface User {
    role?: UserRole;
  }
}
