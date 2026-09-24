import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { cleanupOldMessages } from './services/messagesService';
import { expireOldRides } from './services/ridesService';
import App from './App.jsx';
import './index.css';

// Best-effort cleanup on app load
cleanupOldMessages();
expireOldRides();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
