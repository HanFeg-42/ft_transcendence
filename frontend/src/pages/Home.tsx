import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import TwoFactorSetup from "../components/TwoFactorSetup";
import PixelButton from "../components/ui/PixelButton";

const routeMap: Record<string, string> = {
  HOME: "/home",
  PROFILE: "/profile",
  CHAT: "/chat",
  NOTIFICATION: "/notifications",
  SETTINGS: "/settings",
};

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) {
      navigate(path);
    }
  };

  return (
    <Background>
      <Navbar activeTab="HOME" onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col gap-6">
        <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">
          Pacova Dashboard
        </h1>

        <p className="font-vt323 text-gray-300 text-xl">
          Welcome, {user?.username}!
        </p>

        <TwoFactorSetup />

        <PixelButton
          variant="filled-pink"
          size="lg"
          onClick={() => navigate("/game")}
          className="self-start"
        >
          PLAY NOW
        </PixelButton>
        
        <button
          onClick={handleLogout}
          className="font-vt323 text-pacova-pink text-lg underline self-start uppercase"
        >
          Logout
        </button>
      </main>
    </Background>
  );
}







// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import TwoFactorSetup from "../components/TwoFactorSetup";

// export default function Home() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   return (
//     <div>
//       <h1>Pacova Dashboard</h1>
//       <p>Welcome, {user?.username}!</p>
//       <TwoFactorSetup />
//       <button onClick={handleLogout}>Logout</button>
//     </div>
//   );
// }
