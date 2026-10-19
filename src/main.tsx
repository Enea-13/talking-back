import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { applyTextSize, applyTheme } from './lib/storage';
import './styles.css';

applyTheme();
applyTextSize();
render(<App />, document.getElementById('app')!);
registerSW({ immediate: true });
