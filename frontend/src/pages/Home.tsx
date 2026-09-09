import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Pacova Dashboard</h1>
      <p>Welcome, {user?.username}!</p>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
