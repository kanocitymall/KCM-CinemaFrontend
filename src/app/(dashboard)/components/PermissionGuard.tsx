// components/PermissionGuard.tsx
"use client";

import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;           // Single permission name to check
  permissions?: string[];        // Multiple permissions - user needs ANY of these
  fallback?: ReactNode;          // What to show if no permission (optional)
}

export default function PermissionGuard({
  children,
  permission,
  permissions,
  fallback = null
}: PermissionGuardProps) {
  // Get user from Redux store
  const user = useSelector((state: RootState) => state.auth.main.user);
  
  // If no user or no permissions, show fallback
  if (!user || !user.permissions || !user.permissions.length) {
    return <>{fallback}</>;
  }
  
  let hasPermission = false;
  
  // Check single permission
  if (permission) {
    hasPermission = user.permissions.some(p => 
      p.name.toLowerCase() === permission.toLowerCase()
    );
  }
  
  // Check multiple permissions (user needs ANY of them)
  if (permissions && permissions.length > 0) {
    hasPermission = user.permissions.some(userPerm =>
      permissions.some(requiredPerm => 
        userPerm.name.toLowerCase() === requiredPerm.toLowerCase()
      )
    );
  }
  
  // Return children if user has permission, otherwise fallback
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Helper functions for common permission checks
 */
export function usePermissions() {
  const user = useSelector((state: RootState) => state.auth.main.user);
  
  const hasPermission = (permissionName: string) => {
    if (!user?.permissions) return false;
    return user.permissions.some(p => 
      p.name.toLowerCase() === permissionName.toLowerCase()
    );
  };
  
  const hasAnyPermission = (permissionNames: string[]) => {
    if (!user?.permissions) return false;
    return user.permissions.some(userPerm =>
      permissionNames.some(requiredPerm => 
        userPerm.name.toLowerCase() === requiredPerm.toLowerCase()
      )
    );
  };
  
  return {
    canCreate: (module: string) => hasPermission(`Create ${module}`),
    canEdit: (module: string) => hasPermission(`Edit ${module}`),
    canDelete: (module: string) => hasPermission(`Delete ${module}`),
    canView: (module: string) => hasPermission(`Show ${module}`),
    canManage: (module: string) => hasPermission(`Manage ${module}`),
    hasPermission,
    hasAnyPermission,
    permissions: user?.permissions || [],
    user: user
  };
}

/**
 * Specific button components for common actions
 */
export function CreateButton({ 
  module, 
  children, 
  fallback = null 
}: { 
  module: string; 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <PermissionGuard permission={`Create ${module}`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function EditButton({ 
  module, 
  children, 
  fallback = null 
}: { 
  module: string; 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <PermissionGuard permission={`Edit ${module}`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function DeleteButton({ 
  module, 
  children, 
  fallback = null 
}: { 
  module: string; 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <PermissionGuard permission={`Delete ${module}`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ViewButton({ 
  module, 
  children, 
  fallback = null 
}: { 
  module: string; 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <PermissionGuard permission={`Show ${module}`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ManageButton({ 
  module, 
  children, 
  fallback = null 
}: { 
  module: string; 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <PermissionGuard permission={`Manage ${module}`} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}