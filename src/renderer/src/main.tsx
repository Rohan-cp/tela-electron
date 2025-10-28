import "./assets/main.css";

import React from "react";
import { createHashRouter, RouterProvider } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import Editor from "./routes/Editor";
import ModalProvider from "./contexts/ModalContext";
import AuthPage from "./routes/AuthPage";
import AuthProvider from "./contexts/AuthContext";
import { queryClient } from "./lib/queryClient";

const router = createHashRouter([
  {
    path: "/editor",
    element: <Editor />,
  },
  {
    path: "/",
    element: <AuthPage />,
  },
]);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalProvider>
          <RouterProvider router={router} />
        </ModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
