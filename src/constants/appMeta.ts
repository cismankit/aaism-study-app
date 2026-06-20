/** Canonical desktop / web app identity (App Store target: com.aegis.app) */
import {
  APP_VERSION,
  APP_ICON_BADGE,
  APP_BUILD,
  APP_BUILD_DATE,
  APP_WINDOW_TITLE as GENERATED_WINDOW_TITLE,
  APP_PWA_NAME as GENERATED_PWA_NAME,
  APP_VERSION_SEMVER,
} from './appMeta.generated';

export const APP_NAME = 'Aegis';
export {
  APP_VERSION,
  APP_ICON_BADGE,
  APP_BUILD,
  APP_BUILD_DATE,
  APP_VERSION_SEMVER,
};
export const BUNDLE_ID = import.meta.env.VITE_BUNDLE_ID ?? 'com.aegis.app';
export const APP_WINDOW_TITLE = GENERATED_WINDOW_TITLE;
export const APP_PWA_NAME = GENERATED_PWA_NAME;
