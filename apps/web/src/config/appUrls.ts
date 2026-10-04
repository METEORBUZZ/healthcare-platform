export const PUBLIC_APP_URL = new URL(__PUBLIC_APP_URL__).origin;
export const ADMIN_APP_URL = new URL(__ADMIN_APP_URL__).origin;
export const isAdminOrigin = window.location.origin === ADMIN_APP_URL;
