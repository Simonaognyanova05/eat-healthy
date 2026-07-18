import { useState } from "react";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState(() => window.location.pathname === "/login" ? "login" : "register");
  function showAuth(view) { window.history.pushState({}, "", view === "login" ? "/login" : "/"); setAuthView(view); }
  if (user) return <HomePage user={user} onLoggedOut={() => { setUser(null); showAuth("login"); }} />;
  return authView === "login"
    ? <LoginPage onAuthenticated={setUser} onGoToRegister={() => showAuth("register")} />
    : <RegisterPage onAuthenticated={setUser} onGoToLogin={() => showAuth("login")} />;
}
