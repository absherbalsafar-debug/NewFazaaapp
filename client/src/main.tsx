import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@/lib/api-client-react";
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => localStorage.getItem("fazaah_token"));

createRoot(document.getElementById("root")!).render(<App />);
