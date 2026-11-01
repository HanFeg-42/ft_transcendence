import { Component, type ErrorInfo, type ReactNode } from "react";
import i18n from "../i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches rendering crashes anywhere below it and shows a friendly page. */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center gap-6 bg-black px-4 text-center"
      >
        <h1 className="font-pixelify text-pacova-pink text-4xl uppercase">
          {i18n.t("errorBoundary.title")}
        </h1>

        <p className="font-vt323 text-xl text-gray-300 max-w-md">
          {i18n.t("errorBoundary.description")}
        </p>

        <a href="/" className="font-vt323 text-xl text-pacova-green underline">
          {i18n.t("errorBoundary.backStart")}
        </a>
      </main>
    );
  }
}