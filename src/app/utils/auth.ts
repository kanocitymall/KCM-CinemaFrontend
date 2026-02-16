import Cookies from "js-cookie";
import { appConfig } from "./config";

export const setAuthToken = (token: string) => {
  // We omit 'expires' so it becomes a Session Cookie (deleted on browser close)
  Cookies.set(appConfig.authToken, token, { 
    path: "/",         // Crucial: ensures middleware can see the cookie everywhere
    secure: true,      // Only sent over HTTPS
    sameSite: "strict" // Prevents CSRF
  }); 
};

export const getAuthToken = () => {
  return Cookies.get(appConfig.authToken);
};

export const clearAuthToken = () => {
  // When removing, must match the path used when setting
  Cookies.remove(appConfig.authToken, { path: "/" });
};