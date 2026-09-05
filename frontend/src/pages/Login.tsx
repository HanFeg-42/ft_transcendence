import { useState } from "react";

// Reusable UI components created in the frontend structure
import Background from "../components/ui/Background";
import NeonFrame from "../components/ui/NeonFrame";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

// Types that describe the shape of our login form and API response
import type { LoginFormData, LoginResponse } from "../types/auth";

import { Link } from "react-router-dom";

export default function Login() {
  // formData stores the values typed by the user
  // Example:
  // {
  //   email: "user@email.com",
  //   password: "123456"
  // }
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  // Stores an error message that we can show in the UI
  const [error, setError] = useState("");

  // Tells us if the login request is currently running
  // We use it to disable/change the button while waiting
  const [loading, setLoading] = useState(false);

  /*
   * This function runs every time the user types
   * inside one of the inputs.
   *
   * e.target.name tells us WHICH field changed:
   *   "email"
   *   "password"
   *
   * e.target.value contains the new value.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      // Keep all the old values
      ...formData,

      // Replace only the field that changed
      [e.target.name]: e.target.value,
    });
  };

  /*
   * This function runs when the user submits the form.
   *
   * It will:
   *
   * 1. Stop the browser from refreshing the page
   * 2. Send email + password to our backend
   * 3. Wait for the backend response
   * 4. Handle success or error
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // By default, submitting an HTML form reloads the page.
    // React applications usually prevent that.
    e.preventDefault();

    // Remove any old error before starting a new request
    setError("");

    // Tell the UI that a request is running
    setLoading(true);

    try {
      /*
       * Send a POST request to the login endpoint.
       *
       * The browser sends:
       *
       * POST /api/auth/login
       *
       * Nginx -> API Gateway -> Auth service
       */
      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          // Tell the backend that we are sending JSON
          "Content-Type": "application/json",
        },

        /*
         * fetch cannot send a JavaScript object directly.
         *
         * JSON.stringify converts:
         *
         * {
         *   email: "...",
         *   password: "..."
         * }
         *
         * into JSON text.
         */
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      /*
       * The backend response arrives as HTTP data.
       *
       * response.json() converts the JSON response
       * into a JavaScript object.
       */
      const data = await response.json();

      /*
       * response.ok is true for successful HTTP status codes:
       * 200-299
       *
       * Example failures:
       * 400 -> bad input
       * 401 -> invalid email/password
       */
      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      /*
       * At this point login succeeded.
       *
       * We tell TypeScript that the response should have
       * the LoginResponse structure:
       *
       * {
       *   message: string,
       *   token: string,
       *   user: {...}
       * }
       */
      const loginData: LoginResponse = data;

      /*
       * For now, we only print these values.
       *
       * We are NOT deciding where to permanently store
       * the JWT yet.
       *
       * First we only want to prove that:
       *
       * frontend -> backend -> JWT response
       *
       * works correctly.
       */
      console.log("Logged in user:", loginData.user);
      console.log("JWT received:", loginData.token);
    } catch {
      /*
       * This catch is mainly for network-level problems.
       *
       * Example:
       * - backend unavailable
       * - connection failed
       * - request could not reach the server
       */
      setError("Unable to connect to the server");
    } finally {
      /*
       * finally always runs:
       *
       * success OR error
       *
       * so loading must become false again.
       */
      setLoading(false);
    }
  };

  return (
    <Background>
      {/* Reuse the same visual frame used by the signup page */}
      <NeonFrame variant="pink" size="md">
        {/* When this form is submitted, handleSubmit runs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h1 className="font-display text-neon-pink text-center text-sm tracking-widest">
            • • • LOGIN • • •
          </h1>

          {/* Email input */}
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email..."
            // Current value comes from React state
            value={formData.email}
            // Update state whenever the user types
            onChange={handleChange}
          />

          {/* Password input */}
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password..."
            value={formData.password}
            onChange={handleChange}
          />

          {/*
           * While waiting for the backend:
           *
           * loading = true
           * button shows "LOGGING IN..."
           *
           * Otherwise:
           *
           * loading = false
           * button shows "LOGIN"
           */}
          <Button type="submit" variant="green" styleType="filled">
            {loading ? "LOGGING IN..." : "LOGIN"}
          </Button>

          {/* Show the backend/frontend error only when one exists */}
          {error && <p className="text-center text-red-500 text-xs">{error}</p>}

          {/* Link back to the signup page */}
          <p className="text-center text-neon-pink/70 text-xs font-body">
            Don't have an account?{" "}
            <Link to="/signup" className="text-neon-green underline">
              Create account
            </Link>
          </p>
        </form>
      </NeonFrame>
    </Background>
  );
}
