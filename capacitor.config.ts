import type { CapacitorConfig } from '@capacitor/cli';

// The iOS and Android apps wrap the same build as the web app (dist/), loaded from the device.
// There is deliberately no server.allowNavigation: any link that leaves the bundle (tel: numbers,
// findahelpline.com) is handed to the system, so it opens the phone dialer or the browser.
const config: CapacitorConfig = {
  appId: 'io.github.enea13.talkingback',
  appName: 'Talking Back',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // src/lib/native.ts hides the splash once the first screen is drawn; this is only a backstop.
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    SystemBars: {
      // index.html sets viewport-fit=cover and styles.css pads with env(safe-area-inset-*).
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
