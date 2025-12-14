/**
 * Role Badge Component
 * Displays a user's role with appropriate styling
 */
import { Badge } from '@/components/ui/badge';
import { type UserRole, ROLE_LABELS } from '@/lib/roles';
import { Shield, Edit, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  className?: string;
}

const roleConfig = {
  admin: {
    variant: 'default' as const,
    icon: Shield,
    className: 'bg-red-500 hover:bg-red-600 text-white',
  },
  editor: {
    variant: 'default' as const,
    icon: Edit,
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  viewer: {
    variant: 'default' as const,
    icon: Eye,
    className: 'bg-gray-500 hover:bg-gray-600 text-white',
  },
};

export function RoleBadge({ role, showIcon = false, className = '' }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {ROLE_LABELS[role]}
    </Badge>
  );
}
