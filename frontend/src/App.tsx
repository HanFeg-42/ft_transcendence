import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Game from "./pages/Game";
import ProtectedRoute from "./components/auth/ProtectedRoute";
// import DesignSystem from './pages/DesignSystem'
// import Design from './pages/Design'
import Profile from "./pages/profile";
import GameWs from "./pages/GameWs"; // TEMP
import Chatt from "./pages/Chat2"; // TEMP---------
import UserProfile from "./pages/UserProfile";

/** Renders the application's route configuration. */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/chat" element={<Chat />} />
        
        <Route path="/chat2" element={<Chatt />} /> {/* TEMP------ */}

        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game-ws" element={<GameWs />} /> {/* TEMP */}
      </Route>
      {/* <Route path="/DesignSystem" element={<DesignSystem />} /> */}
      {/* <Route path="/Design" element={<Design />} /> */}
    </Routes>
  );
}

export default App;
