import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Interceptador para atualizar o PWA silenciosamente
const updateSW = registerSW({
  onNeedRefresh() { },
  onOfflineReady() { },
})

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);