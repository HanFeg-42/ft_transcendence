import { useState } from "react";
import { Link } from "react-router-dom";
import Background from "../components/ui/Background";
import Input from "../components/ui/Input";
import Card from '../components/ui/Card';
import PixelButton from '../components/ui/PixelButton';
// import  ICONS  from '../assets/icons/packman-blue-3d.png';
import type { LoginFormData, LoginResponse } from '../types/auth';

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      const loginData: LoginResponse = data;
      setSuccess('Logged in successfully');
      console.log('Logged in user:', loginData.user);
    } catch (error) {
      console.error('Login request failed:', error);
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handle42Login = () => {
    // Redirects to your backend 42 OAuth Endpoint
    window.location.href = 'https://localhost:443/api/auth/42/login'; 
};

  return (
    <Background>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card variant="pink" className="max-w-xl w-full p-6">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
            noValidate
          >
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className="font-pixelify text-pacova-pink text-2xl tracking-wider uppercase">
                ▼ ▼ LOGIN ▼ ▼
              </h1>
            </div>

            {/* Inputs */}
            <Input
              label="EMAIL"
              type="email"
              name="email"
              placeholder="Enter your email..."
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              label="PASSWORD"
              type="password"
              name="password"
              placeholder="Enter your password..."
              value={formData.password}
              onChange={handleChange}
            />

            {/* Feedback Messages */}
            {error && (
              <p className="text-center font-vt323 text-red-500 text-lg uppercase tracking-wide">
                ⚠️ {error}
              </p>
            )}

            {success && (
              <p className="text-center font-vt323 text-pacova-green text-lg uppercase tracking-wide">
                ✓ {success}
              </p>
            )}

            {/* Action Button */}
            <PixelButton
              type="submit"
              variant="filled-pink"
              size="md"
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </PixelButton>

            {/* Divider */}
            <div className="flex items-center my-1">
              <div className="flex-1 border-t border-pacova-pink/30"></div>
              <span className="px-3 font-vt323 text-gray-400 text-base">OR</span>
              <div className="flex-1 border-t border-pacova-pink/30"></div>
            </div>
            {/* 42 OAuth Button */}
            <PixelButton
              type="button"
              variant="olive-yellow"
              // variant="outline-magenta"
              size="md"
              onClick={handle42Login}
              className="w-full flex items-center justify-center gap-3"
            >

              <span>CONTINUE WITH 42</span>
            </PixelButton>

            {/* Navigation Link */}
            <div className="text-center border-t border-pacova-pink/30 pt-4 mt-2 font-vt323 text-lg">
              <span className="text-gray-400">DON'T HAVE AN ACCOUNT? </span>
              <Link
                to="/signup"
                className="text-pacova-green hover:underline uppercase tracking-wide"
              >
                CREATE ACCOUNT
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </Background>
  );
}