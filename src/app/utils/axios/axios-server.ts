import axios from "axios";
import { cookies } from "next/headers";
import { appConfig } from "../config";

const v1URL = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/v1";

export const createServerInstance = async () => {
  const cookieStore = cookies(); // Access server-side cookies
  const token = (await cookieStore).get(appConfig.authToken)?.value;

  return axios.create({
    baseURL: v1URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
};
export const getApiServerInstance = async () => {
  return createServerInstance();
};
