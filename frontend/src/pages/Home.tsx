import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TwoFactorSetup from "../components/TwoFactorSetup";

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
      <TwoFactorSetup />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
