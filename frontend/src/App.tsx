import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Game from "./pages/Game/GamePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Choose from './pages/Game/chooseGameMode';
// import Nav from './pages/NavbarTest'
import Profile from "./pages/user/profile";
import UserProfile from "./pages/user/UserProfile";
import Privacy from "./pages/legal/PrivacyPolicy";
import Terms from "./pages/legal/TermsOfService";
import Leaderboard from "./pages/Leaderboard";
import FriendsTest from "./pages/FriendsTest";
import NotFound from "./pages/NotFound";
import BotPage from "./pages/Game/GameBot";
import OnlineGame from "./pages/OnlineGame";

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
        <Route path="/friends-test" element={<FriendsTest />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game/online" element={<OnlineGame />} /> {/* TEMP */}
        <Route path="/game/bot" element={<BotPage />} />
        {/* <Route path="/game-ws" element={<GameWs />} />  */}
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>
      <Route path="/choose" element={<Choose/>} />
      {/* <Route path="/NavbarTest" element={<Nav />} /> */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<NotFound />} />
      
     </Routes>
  );
}

export default App;
