import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_URL } from "./amplify";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) config.headers.Authorization = token;
  } catch {}
  return config;
});

export default api;
