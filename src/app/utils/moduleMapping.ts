export const moduleIdToNameMap: Record<number, string> = {
  1: "User",
  2: "Customer",
  3: "Hall",
  5: "Program",
  6: "Schedule",
  7: "Booking",
  8: "Account",
  12: "Configuration",
};

export const getModuleName = (moduleId: number): string => {
  return moduleIdToNameMap[moduleId] || "Unknown Module";
};
