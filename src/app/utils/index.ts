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
  const s = String(datetime).trim();

  // Case 1: full datetime like "2026-02-25 21:00:00"
  if (s.includes(" ")) {
    const iso = s.replace(" ", "T");
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    }
  }

  // Case 2: time-only string like "21:00" or "21:00:00"
  const timeOnlyMatch = s.match(/^(\d{1,2}):(\d{2})(?:\:\d{2})?$/);
  if (timeOnlyMatch) {
    let hh = parseInt(timeOnlyMatch[1], 10);
    const mm = timeOnlyMatch[2];
    const period = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 === 0 ? 12 : hh % 12;
    return `${hh}:${mm}${period}`;
  }

  // Fallback: try Date parse generically
  const isoFallback = s.replace(" ", "T");
  const d2 = new Date(isoFallback);
  if (!isNaN(d2.getTime())) {
    return d2.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  return s;
};


