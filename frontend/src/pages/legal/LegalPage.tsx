
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../../components/ui/Background";
import { useAuth } from "../../context/AuthContext";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

interface LegalPageProps {
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated: string;
}

export default function LegalPage({
  title,
  intro,
  sections,
  lastUpdated,
}: LegalPageProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <Background>
      <main className="w-full max-w-3xl mx-auto px-4 py-10 sm:py-14 font-inter text-gray-200">
        <Link
          to={user ? "/home" : "/"}
          className="font-vt323 text-lg text-pacova-green hover:underline uppercase tracking-wide"
        >
          {t("legalBack")}
        </Link>

        <h1 className="font-press-start text-pacova-pink text-xl sm:text-2xl mt-6 mb-2 leading-relaxed">
          {title}
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          {t("legalLastUpdated", { date: lastUpdated })}
        </p>
        <p className="mb-8 leading-relaxed">{intro}</p>

        {sections.map((section, index) => (
          <section key={index} className="mb-8">
            <h2 className="font-pixelify text-pacova-green text-xl mb-3">
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs?.map((paragraph, i) => (
              <p key={i} className="mb-3 leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.items && (
              <ul className="list-disc pl-6 space-y-1 leading-relaxed">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
    </Background>
  );
}
