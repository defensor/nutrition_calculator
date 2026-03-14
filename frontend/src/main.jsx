import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import { DialogProvider } from './context/DialogContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <DialogProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </DialogProvider>
    </NotificationProvider>
  </React.StrictMode>,
);
