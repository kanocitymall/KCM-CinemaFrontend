import axios from "axios";
import Cookies from "js-cookie";
import { appConfig } from "../config";
import showSingleToast from "../single-toast";

const v1URL = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/v1";

export const createClientInstance = () => {
  const token = Cookies.get(appConfig.authToken);

  const instance = axios.create({
    baseURL: v1URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });

  // Centralized response error handling: show a single network error toast
  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      // If there's no response it's likely a network failure
      if (!error.response) {
        showSingleToast("Network error. Check your internet connection and try again.", "network");
      } else if (error.response && error.response.status >= 500) {
        showSingleToast("Server error. Please try again later.", "server");
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const getApiClientInstance = () => {
  return createClientInstance();
};
