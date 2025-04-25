import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css';
import LandingPage from './components/LandingPage.jsx';

createRoot(document.getElementById('root')).render(
  <LandingPage />
)
