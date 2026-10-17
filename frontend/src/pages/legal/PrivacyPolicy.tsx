import LegalPage from "./LegalPage";
import type { LegalSection } from "./LegalPage";
import { CONTACT_EMAIL, LAST_UPDATED } from "./legalInfo";

const sections: LegalSection[] = [
  {
    title: "Who we are",
    paragraphs: [
      "Pacova is a multiplayer web game built by a team of students at 42 / 1337 School as part of the ft_transcendence project. It is a non-commercial, educational project.",
      `This policy explains what personal data Pacova collects, why we collect it, and what your rights are. If you have any question, write to us at ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "The data we collect",
    items: [
      "Account data: your username, your email address and a hashed password (we never store your password in plain text). If you sign in with your 42 account, we receive your 42 username, your email address and your 42 profile picture from 42.",
      "Profile data: your display name, bio, status message and the avatar you upload.",
      "Game data: the matches you play, their results and scores, your statistics, level, achievements and leaderboard position.",
      "Social data: your chat messages, friends and friend requests, the users you block, your notifications and your online / offline status.",
      "Security data: if you enable two-factor authentication, the secret used to generate your codes and hashed recovery codes.",
      "Technical data: a session cookie (see section 4) and server logs of requests made to the service, used for security and debugging.",
    ],
  },
  {
    title: "Why we use your data",
    items: [
      "To create your account and let you sign in securely.",
      "To run the game, record matches and compute statistics, achievements and the leaderboard.",
      "To let you chat, add friends and receive notifications.",
      "To display your profile to other players.",
      "To keep the service secure, prevent abuse and fix bugs.",
    ],
    paragraphs: [
      "We do not sell your data, we do not show advertising and we do not use analytics or tracking tools.",
    ],
  },
  {
    title: "Cookies and local storage",
    items: [
      "One essential cookie keeps you signed in for up to 7 days. It is sent only to our authentication service, cannot be read by scripts, is only sent over HTTPS and is not sent from other websites.",
      "The chat page stores markers on your device (local storage) so it can show which messages you have not read yet.",
    ],
    paragraphs: [
      "We do not use advertising or tracking cookies. Because these are strictly necessary to provide the service, there is no cookie banner.",
    ],
  },
  {
    title: "Who can see your data",
    items: [
      "Other signed-in players can see your username, avatar, bio, status message, statistics, achievements, match history and online status.",
      "Your chat messages are visible only to the people in the conversation.",
      "Your email address and your password are never shown to other players.",
      "Pacova runs on servers operated by the project team. We do not share your data with third parties. The only exception is 42: if you choose to sign in with 42, their own privacy policy applies to that sign-in.",
    ],
  },
  {
    title: "How long we keep your data",
    paragraphs: [
      "We keep your data for as long as your account exists, because chat history, match history and statistics are part of the service.",
      `Account deletion is not yet available inside the app. You can ask us to delete your account at ${CONTACT_EMAIL}. When we do, we delete your profile, messages and game data.`,
    ],
  },
  {
    title: "How we protect your data",
    paragraphs: [
      "All connections to Pacova use HTTPS. Passwords are hashed before storage. You can add two-factor authentication to your account in the app. Only members of the project team can access the servers.",
      "No online service can be perfectly secure. If you find a security problem, please tell us at the address below so we can fix it.",
    ],
  },
  {
    title: "Your rights",
    items: [
      "Access: ask for a copy of the personal data we hold about you.",
      "Correction: update your profile information at any time from your profile page, or ask us to correct anything else.",
      "Deletion: ask us to delete your account and data.",
      "Objection and limitation: ask us to stop or limit certain uses of your data.",
    ],
    paragraphs: [
      `To use any of these rights, write to ${CONTACT_EMAIL}. We aim to answer within 30 days. You can also contact your local data protection authority (for example the CNDP in Morocco, or your national authority if you live in the European Union).`,
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "Pacova is not intended for children under 13. If you believe a child has created an account, contact us and we will delete it.",
    ],
  },
  {
    title: "Changes to this policy",
    paragraphs: [
      "We may update this policy as the project evolves. The date at the top of the page shows the latest version. If a change is important, we will tell you in the app.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [`Questions about your privacy: ${CONTACT_EMAIL}`],
  },
];

/** Privacy Policy page. */
export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Your privacy matters to us. This page explains in plain language what Pacova does with your personal data."
      sections={sections}
      lastUpdated={LAST_UPDATED}
    />
  );
}