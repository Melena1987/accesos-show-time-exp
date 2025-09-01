
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const embedGoogleFonts = async () => {
  try {
    const response = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    if (response.ok) {
      const cssText = await response.text();
      const style = document.createElement('style');
      style.textContent = cssText;
      document.head.appendChild(style);
    } else {
      throw new Error(`Failed to fetch font CSS: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Could not fetch and embed Google Fonts. Exported images may not have the correct font.', error);
  }
};

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const initialize = async () => {
  await embedGoogleFonts();
  startApp();
}

// This ensures that the app only starts after the HTML document is fully ready.
// It prevents a race condition that can cause a blank screen on deployment.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}