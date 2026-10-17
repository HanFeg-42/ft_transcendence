import { Link } from "react-router-dom";
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

/** Shared layout for the Privacy Policy and Terms of Service pages. */
export default function LegalPage({
  title,
  intro,
  sections,
  lastUpdated,
}: LegalPageProps) {
  const { user } = useAuth();

  return (
    <Background>
      <main className="w-full max-w-3xl mx-auto px-4 py-10 sm:py-14 font-inter text-gray-200">
        <Link
          to={user ? "/home" : "/"}
          className="font-vt323 text-lg text-pacova-green hover:underline uppercase tracking-wide"
        >
          ← Back
        </Link>

        <h1 className="font-press-start text-pacova-pink text-xl sm:text-2xl mt-6 mb-2 leading-relaxed">
          {title}
        </h1>
        <p className="text-sm text-gray-400 mb-6">Last updated: {lastUpdated}</p>
        <p className="mb-8 leading-relaxed">{intro}</p>

        {sections.map((section, index) => (
          <section key={section.title} className="mb-8">
            <h2 className="font-pixelify text-pacova-green text-xl mb-3">
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs?.map((text) => (
              <p key={text} className="mb-3 leading-relaxed">
                {text}
              </p>
            ))}
            {section.items && (
              <ul className="list-disc pl-6 space-y-1 leading-relaxed">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
    </Background>
  );
}