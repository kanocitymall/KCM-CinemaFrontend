"use client";
import ActiveLink from "./active-link";
import { PiBuildingApartment } from "react-icons/pi";
import { IoSettingsOutline } from "react-icons/io5";
import { RiGroupLine } from "react-icons/ri";
import { MdDashboard, MdLogout } from "react-icons/md";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Dropdown from "./drop-down";
import { IconType } from "react-icons";
import { FaStore } from "react-icons/fa";
import { getModuleName } from "../../../../utils/moduleMapping";
import { useMemo, useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { appConfig } from "../../../../utils/config";
// import { HiUserGroup } from "react-icons/hi";
// Mapping icons to module names
const iconMap: Record<string, IconType> = {

  User: RiGroupLine,
  Customer: RiGroupLine,
  Program: FaStore,
  Hall: PiBuildingApartment,
  Schedule: IoSettingsOutline,
  Account: IoSettingsOutline,
  Booking: PiBuildingApartment,
  Configuration: IoSettingsOutline,
  
};

const moduleListPages: Record<string, string[]> = {
  Account: [
    "Account List",
    "Transaction List",
    "Expense List",
  ],
  Customer: ["Customer List"],
  Program: ["Program Type List","Program List"],
  Hall: ["Hall List"],
  Schedule: ["Schedule List", "Schedule Now"],
  Booking: ["Booking List"],
  User: ["User List"],
  Configuration: ["Company Settings", "Activity Logs"],

 
};

const NavMenus = () => {
  const router = useRouter();
  const userPermissions = useSelector(
    (state: RootState) => state.auth.main.user?.permissions
  );

  const handleLogout = useCallback(() => {
    // Remove auth token
    Cookies.remove(appConfig.authToken);
    // Redirect to login
    router.push('/auth/login');
  }, [router]);

  const modules = useMemo(() => {
  if (!userPermissions) return [];

  const uniqueModules = new Set<string>();
  const excludedModuleIds = [ 10, 11];

  userPermissions.forEach((permission) => {
    const moduleName = getModuleName(permission.module_id);

    // Skip modules that should be under Account
    if (!excludedModuleIds.includes(permission.module_id) && moduleName !== "Unknown Module") {
      uniqueModules.add(moduleName);
    }
  });

  const moduleArray = Array.from(uniqueModules);

  // Custom sort order defined by business requirement
  const priorityOrder = [
    'Configuration',
    'User',
    'Account',
    'Schedule',
    'Program',
  ];

  moduleArray.sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    if (idxA !== -1 || idxB !== -1) {
      // if one of them appears in priority list, sort by its index
      if (idxA === -1) return 1; // a is not prioritized, put later
      if (idxB === -1) return -1; // b is not prioritized
      return idxA - idxB;
    }
    // otherwise fall back to alphabetical
    return a.localeCompare(b);
  });

  return moduleArray;
}, [userPermissions]);

  return (
    <div className="d-flex flex-column h-100 pb-3">
      <div className="flex-grow-1">
        <div className="ms-1 d-flex flex-column">
          <ActiveLink href={`/dashboard`}>
            <MdDashboard />
            Dashboard
          </ActiveLink>

          {modules.map((moduleName, i) => {
            const Icon = iconMap[moduleName] || MdDashboard;
            const listPages = moduleListPages[moduleName] || [];

            return (
              <Dropdown
                key={i}
                label={moduleName}
                listPages={listPages}
                Icon={Icon}
              />
            );
          })}
        </div>
      </div>
      
      {/* Logout Button at the bottom with space above */}
      <div className="ms-1 mt-auto" style={{ paddingTop: '10rem' }}>
        <button 
          onClick={handleLogout}
          className="btn btn-link text-white text-decoration-none d-flex align-items-center gap-2 w-100 justify-content-start"
          style={{ fontSize: '0.95rem' }}
        >
          <MdLogout size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default NavMenus;


