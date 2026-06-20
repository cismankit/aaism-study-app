/** Canonical desktop / web app identity (App Store target: com.aegis.app) */
export const APP_NAME = 'Aegis';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0';
export const APP_BUILD = import.meta.env.VITE_APP_BUILD ?? 'dev';
export const BUNDLE_ID = import.meta.env.VITE_BUNDLE_ID ?? 'com.aegis.app';
export const APP_WINDOW_TITLE = `${APP_NAME} · v${APP_VERSION} (build ${APP_BUILD})`;
export const APP_PWA_NAME = `${APP_NAME} v${APP_VERSION}`;
