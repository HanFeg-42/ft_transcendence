import LegalPage from "./LegalPage";
import type { LegalSection } from "./LegalPage";
import { CONTACT_EMAIL, LAST_UPDATED } from "./legalInfo";

const sections: LegalSection[] = [
  {
    title: "Acceptance of these terms",
    paragraphs: [
      "By creating an account or using Pacova, you agree to these Terms of Service and to our Privacy Policy. If you do not agree, please do not use the service.",
    ],
  },
  {
    title: "What Pacova is",
    paragraphs: [
      "Pacova is a multiplayer web game with chat, friends, profiles and leaderboards. It is a non-commercial student project made by a team at 42 / 1337 School for educational purposes.",
      "The service is provided as is. It may change, be interrupted or be shut down at any time, and data may be lost, for example during development or maintenance.",
    ],
  },
  {
    title: "Your account",
    items: [
      "You must provide accurate information when you sign up.",
      "You must be at least 13 years old to use Pacova.",
      "You are responsible for keeping your password safe, and we recommend enabling two-factor authentication.",
      "You are responsible for what happens under your account. Tell us at once if you think someone else is using it.",
      "One person, one account: do not share accounts or create several accounts to gain an advantage.",
    ],
  },
  {
    title: "Fair play and acceptable use",
    paragraphs: ["When you use Pacova, you agree not to:"],
    items: [
      "cheat, exploit bugs or use bots, scripts or other automated tools to gain an unfair advantage in matches (the built-in AI opponent is the only automated player allowed);",
      "harass, threaten, insult or discriminate against other players, in chat or in your profile;",
      "post illegal, hateful, sexual or violent content, including in your username, bio or avatar;",
      "pretend to be another person or a member of the team;",
      "try to break, overload or gain unauthorised access to the service, its servers or other users' accounts;",
      "collect other users' data or send them spam.",
    ],
  },
  {
    title: "Your content",
    paragraphs: [
      "You keep the rights to what you create on Pacova, such as your bio, avatar and chat messages. You allow us to store and display that content as needed to run the service, for example to show your profile to other players and to deliver your messages.",
      "You are responsible for your content. We may remove content that breaks these terms.",
    ],
  },
  {
    title: "Suspension and ending your account",
    paragraphs: [
      "We may warn, suspend or delete accounts that break these terms or put the service or other players at risk.",
      `You can stop using Pacova at any time. To have your account and data deleted, write to ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "Ownership and trademarks",
    paragraphs: [
      "The code, design and original content of Pacova belong to the project team.",
      "Pacova is an independent student project inspired by classic arcade games. It is not affiliated with, sponsored or endorsed by Bandai Namco Entertainment. PAC-MAN is a trademark of its respective owner.",
    ],
  },
  {
    title: "No warranty and limit of liability",
    paragraphs: [
      "Because Pacova is a free student project, we do not promise that it will be available, error-free or secure at all times. To the extent allowed by law, the project team is not liable for any loss or damage resulting from your use of the service, including lost data, lost progress or temporary unavailability.",
    ],
  },
  {
    title: "Changes to these terms",
    paragraphs: [
      "We may update these terms as the project evolves. The date at the top of the page shows the latest version. If you keep using Pacova after a change, you accept the new terms.",
    ],
  },
  {
    title: "Governing law",
    paragraphs: [
      "These terms are governed by the laws of Morocco, without affecting any mandatory rights you have under the law of the country where you live.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [`Questions about these terms: ${CONTACT_EMAIL}`],
  },
];

/** Terms of Service page. */
export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="Please read these rules before playing. They keep Pacova fun and safe for everyone."
      sections={sections}
      lastUpdated={LAST_UPDATED}
    />
  );
}