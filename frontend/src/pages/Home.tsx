import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const testGameAuth = async () => {
    if (!token) {
      console.error("No token available");
      return;
    }

    try {
      const response = await fetch("/api/game/whoami", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("Game auth response:", data);
    } catch (error) {
      console.error("Game auth test failed:", error);
    }
  };

  return (
    <div>
      <h1>Pacova Dashboard</h1>
      <p>Welcome, {user?.username}!</p>

      <button onClick={handleLogout}>Logout</button>
      <button onClick={testGameAuth}> Test Game Auth</button>
    </div>
  );
}
