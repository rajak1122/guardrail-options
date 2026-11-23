import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Geist Sans — UI typography
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";

// Geist Mono — financial data typography
import "@fontsource-variable/geist-mono/wght.css";

import "./index.css";
import App from "./App.jsx";
import { TradingProvider } from "./context/TradingContext.jsx";
import { ThemeProvider } from "./context/ThemeProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <TradingProvider>
        <App />
      </TradingProvider>
    </ThemeProvider>
  </StrictMode>,
);
