// src/lib/axiosClient.ts
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://local-hr-admin.test/admin/api-response",
  withCredentials: true,
});

export default axiosClient;
