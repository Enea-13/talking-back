import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

// The iOS and Android apps (Capacitor) run the same code as the web app. Everything here is a
// no-op on the web, where the browser's own share sheet, voice and theme-color meta tags apply.

/** True inside the iOS or Android app; false in a browser and in the installed PWA. */
export const isNative = Capacitor.isNativePlatform();

/** A light tap under the finger (Save). */
export function tap() {
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** The system share sheet. Rejects if it is dismissed, like navigator.share. */
export async function shareNative(text: string) {
  await Share.share({ title: 'Talking Back', text, dialogTitle: 'Share' });
}

const darkQuery = matchMedia('(prefers-color-scheme: dark)');

/** The theme actually showing: a chosen light or dark (see applyTheme), else the device setting. */
const isDark = () => (document.documentElement.dataset.theme ?? (darkQuery.matches ? 'dark' : 'light')) === 'dark';

/** Status bar text follows the page: dark ink on vellum by day, light text in the night vigil. */
function matchBars() {
  const dark = isDark();
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
  if (Capacitor.getPlatform() === 'android') {
    SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light, bar: SystemBarType.NavigationBar }).catch(() => {});
  }
}

/** Native start-up, after the first render: match the system bars to the theme, then lift the splash. */
export function startNative() {
  matchBars();
  new MutationObserver(matchBars).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  darkQuery.addEventListener('change', matchBars);
  SplashScreen.hide().catch(() => {});
}
