import { createRoot } from 'react-dom/client';
import App from './App';
import '~/assets/tailwind.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
