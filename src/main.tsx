import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { applyTextSize, applyTheme } from './lib/storage';
import { isNative, startNative } from './lib/native';
import './styles.css';

applyTheme();
applyTextSize();
render(<App />, document.getElementById('app')!);
// The store apps ship each build whole, so there a service worker could only serve a stale copy.
if (isNative) startNative();
else registerSW({ immediate: true });
