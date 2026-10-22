import { useNavigate } from "react-router-dom";
import Background from "../components/ui/Background";
import PixelButton from "../components/ui/PixelButton";
import { useAuth } from "../context/AuthContext";

/** Shown for any URL that matches no route. */
export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Background>
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <p aria-hidden="true" className="font-press-start text-pacova-pink text-5xl sm:text-7xl">
          404
        </p>
        <h1 className="font-pixelify text-pacova-green text-3xl uppercase">
          Page not found
        </h1>
        <p className="font-vt323 text-xl text-gray-300 max-w-md">
          Looks like this maze has no exit here. The page you are looking for
          does not exist or has been moved.
        </p>
        <PixelButton
          variant="filled-pink"
          size="lg"
          onClick={() => navigate(user ? "/home" : "/")}
        >
          {user ? "Back to home" : "Back to start"}
        </PixelButton>
      </main>
    </Background>
  );
}