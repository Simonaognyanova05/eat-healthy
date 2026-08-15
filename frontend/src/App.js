import { useState } from "react";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { GuestPage } from "./pages/GuestPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState(() => window.location.pathname === "/login" ? "login" : window.location.pathname === "/register" ? "register" : "guest");
  function showAuth(view) { window.history.pushState({}, "", view === "login" ? "/login" : view === "register" ? "/register" : "/"); setAuthView(view); }
  function handleAuthenticated(authenticatedUser) {
    window.history.replaceState({}, "", "/");
    setUser(authenticatedUser);
  }
  if (user) return <HomePage user={user} onLoggedOut={() => { setUser(null); showAuth("login"); }} />;
  return authView === "guest" ? <GuestPage onAuthenticated={handleAuthenticated} onRegister={() => showAuth("register")} onLogin={() => showAuth("login")} /> : authView === "login"
    ? <LoginPage onAuthenticated={handleAuthenticated} onGoToRegister={() => showAuth("register")} />
    : <RegisterPage onAuthenticated={handleAuthenticated} onGoToLogin={() => showAuth("login")} />;
}
