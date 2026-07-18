import { useState } from "react";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
  const [user, setUser] = useState(null);
  return user
    ? <HomePage user={user} onLoggedOut={() => setUser(null)} />
    : <RegisterPage onAuthenticated={setUser} />;
}
