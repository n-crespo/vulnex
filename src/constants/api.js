export const API_BASE_URL = (
  import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://vulnex-api.onrender.com"
).replace(/\/$/, "");

export const ENDPOINTS = {
  LOGIN: "/api/users/login",
  REGISTER: "/api/users/register",
  CVES: "/api/cves",
  BULK_SCAN: "/api/cves/bulk-scan",
};
