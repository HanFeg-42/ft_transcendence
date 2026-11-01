import { useTranslation } from "react-i18next";
import LegalPage from "./LegalPage";
import type { LegalSection } from "./LegalPage";
import { CONTACT_EMAIL, LAST_UPDATED } from "./legalInfo";

export default function TermsOfService() {
  const { t } = useTranslation();

  const sections = t("terms.sections", {
    returnObjects: true,
    email: CONTACT_EMAIL,
  }) as LegalSection[];

  return (
    <LegalPage
      title={t("terms.title")}
      intro={t("terms.intro")}
      sections={sections}
      lastUpdated={LAST_UPDATED}
    />
  );
}