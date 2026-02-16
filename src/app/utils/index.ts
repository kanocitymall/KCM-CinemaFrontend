import { AuthResponse, Permission } from "@/types";

export const PASSWORD_CONSTRAINT =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // 8+ characters, a letter, number, and symbol

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

export const unSlugify = (text: string) => {
  return text.toString().replace("-", " ");
};

export const capitalizeWords = (input: string): string => {
  return input
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};


export const getGroupedPermissions = (authResponse: AuthResponse): Record<number, Permission[]> => {
  const permissions = getUserPermissions(authResponse);
  
  return permissions.reduce((groups: Record<number, Permission[]>, permission: Permission) => {
    const moduleId = permission.module_id;
    
    if (!groups[moduleId]) {
      groups[moduleId] = [];
    }
    
    groups[moduleId].push(permission);
    return groups;
  }, {});
};


export const getUserPermissions = (authResponse: AuthResponse): Permission[] => {
  if (!authResponse?.success || !authResponse.data?.user?.permissions) {
    return [];
  }
  
  return authResponse.data.user.permissions;
};


export const getUserPermissionNames = (authResponse: AuthResponse): string[] => {
  const permissions = getUserPermissions(authResponse);
  return permissions.map(permission => permission.name);
};


export const hasPermission = (authResponse: AuthResponse, permissionName: string): boolean => {
  const permissions = getUserPermissions(authResponse);
  return permissions.some(permission => permission.name === permissionName);
};

export const formatTimeTo12Hour = (datetime?: string | null): string => {
  if (!datetime) return "";
  const iso = String(datetime).replace(" ", "T");
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // Fallback: try to return the time portion if available
    const parts = String(datetime).split(" ");
    return parts[1] ?? String(datetime);
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
};

