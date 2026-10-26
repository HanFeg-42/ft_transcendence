import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next"

/** Site-wide footer with links to the legal pages. */
export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 w-full py-3 px-4 text-center font-vt323 text-base text-gray-400">
      <nav
        aria-label={t("footerLegal")}
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
      >
        <Link
          to="/privacy"
          className="hover:text-pacova-green hover:underline uppercase tracking-wide"
        >
          {t("footerPrivacy")}
        </Link>
        <span aria-hidden="true" className="text-pacova-gray">
          |
        </span>
        <Link
          to="/terms"
          className="hover:text-pacova-green hover:underline uppercase tracking-wide"
        >
          {t("footerTerms")}
        </Link>
        <span aria-hidden="true" className="text-pacova-gray">
          |
        </span>
        <span>© 2026 Pacova</span>
      </nav>
    </footer>
  );
}