"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var client_1 = require("react-dom/client");
var ErrorBoundary_tsx_1 = require("./components/ErrorBoundary.tsx");
require("./index.css");
var App_tsx_1 = require("./App.tsx");
(0, client_1.createRoot)(document.getElementById('root')).render(<react_1.StrictMode>
    <ErrorBoundary_tsx_1.ErrorBoundary>
      <App_tsx_1.default />
    </ErrorBoundary_tsx_1.ErrorBoundary>
  </react_1.StrictMode>);
