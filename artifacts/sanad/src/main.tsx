import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => localStorage.getItem("fazaah_token"));
setBaseUrl(import.meta.env.VITE_API_BASE_URL || null);

createRoot(document.getElementById("root")!).render(<App />);
