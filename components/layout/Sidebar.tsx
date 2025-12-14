'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { useUIStore } from '@/store/uiStore';
import { useSession, signOut } from '@/lib/auth-client';
import {
  LayoutDashboard,
  Database,
  Code,
  Mail,
  BarChart,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePermissions } from '@/hooks/usePermissions';

const iconMap = {
  LayoutDashboard,
  Database,
  Code,
  Mail,
  BarChart,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { data: session } = useSession();
  const user = session?.user;
  const { isAdmin } = usePermissions();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-card border-r transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20',
          'max-md:shadow-lg',
          !sidebarOpen && 'max-md:-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-lg">Cold Email</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              !sidebarOpen && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          // Hide Settings for non-admins
          if (item.href === '/dashboard/settings' && !isAdmin()) {
            return null;
          }


          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
                !sidebarOpen && 'justify-center'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4 shrink-0">
        <div
          className={cn(
            'flex items-center gap-3',
            !sidebarOpen && 'justify-center'
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback>
              {user?.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 mt-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </aside>
    </>
  );
}
