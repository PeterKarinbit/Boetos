import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Assuming you have a global CSS file
import './styles/calendar.css'; // Ensure this is imported after index.css if it contains resets
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import { UserProvider } from './contexts/UserContext';

// Find the root element in your index.html
const rootElement = document.getElementById('root');

// Ensure the root element exists before creating the root
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <UserProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UserProvider>
    </React.StrictMode>,
  );
} else {
  console.error('Root element with ID "root" not found in the document.');
} 