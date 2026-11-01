
import { useTranslation } from "react-i18next";
import LegalPage from "./LegalPage";
import type { LegalSection } from "./LegalPage";
import { CONTACT_EMAIL, LAST_UPDATED } from "./legalInfo";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  const sections = t("privacy.sections", {
    returnObjects: true,
    email: CONTACT_EMAIL,
  }) as LegalSection[];

  return (
    <LegalPage
      title={t("privacy.title")}
      intro={t("privacy.intro")}
      sections={sections}
      lastUpdated={LAST_UPDATED}
    />
  );
}
