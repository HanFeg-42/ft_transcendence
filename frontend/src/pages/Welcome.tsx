import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PixelButton from "../components/ui/PixelButton";
import Footer from "../components/ui/Footer";

/** Renders the responsive landing page and its primary authentication actions. */
export default function Welcome() {
  const { t } = useTranslation();

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col bg-black text-white">
      {/* Shared background for both the content and footer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <img
          src="/images/pacova-welcome.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[65%_center] sm:object-center"
        />

        {/* Darken the image so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/25 sm:via-black/70 sm:to-black/20" />

        {/* Extra contrast at the bottom on small screens */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>

      <main className="relative flex flex-1 items-center">
        <section className="mx-auto flex w-full max-w-[1600px] items-center px-5 py-10 sm:px-10 sm:py-14 md:px-14 lg:px-20 xl:px-24">
          <div className="w-full max-w-xl">
            <p className="mb-3 font-vt323 text-xl tracking-[0.3em] text-pacova-green sm:mb-5 sm:text-2xl">
              . . .
            </p>

            <h1 className="font-pixelify text-3xl font-bold uppercase leading-[1.35] tracking-wide sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="block">{t("welcomeTitle")}</span>

              <span className="mt-1 block">
                {t("welcomeWith")}{" "}
                <span className="text-pacova-pink drop-shadow-[0_0_12px_rgba(255,20,147,0.55)]">
                  Pacova
                </span>
              </span>

              <span className="mt-1 block text-pacova-pink">
                {t("welcomeJoin")}
              </span>
            </h1>

            <div className="my-4 font-vt323 text-xl tracking-widest text-pacova-green sm:my-6 sm:text-2xl">
              - - -
            </div>

            <p className="mb-7 max-w-md font-vt323 text-lg leading-relaxed text-gray-200 sm:mb-9 sm:text-xl md:text-2xl">
              {t("welcomeDescription")}
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4">
              <Link to="/login" className="w-full sm:w-auto">
                <PixelButton
                  variant="filled-pink"
                  size="lg"
                  className="w-full sm:min-w-36"
                >
                  {t("login")}
                </PixelButton>
              </Link>

              <Link to="/signup" className="w-full sm:w-auto">
                <PixelButton
                  variant="olive-yellow"
                  size="lg"
                  className="w-full sm:min-w-36"
                >
                  {t("signup")}
                </PixelButton>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
