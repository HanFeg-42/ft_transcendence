import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      settings: "Settings",
      account: "Account",
      security: "Security",
      preferences: "Preferences",
      language: "Language",
      editProfile: "Edit Profile",
      accountDescription: "Manage your profile information.",
securityDescription: "Protect your account with two-factor authentication.",
close2fa: "CLOSE 2FA",
manage2fa: "MANAGE 2FA",
loggingOut: "LOGGING OUT...",
logout: "LOG OUT",
logoutError: "Logout failed. Please try again.",
preferencesDescription: "Choose which notifications you want to receive.",
friendRequests: "FRIEND REQUESTS",
friendRequestsDescription: "When someone sends you a friend request.",
gameInvitations: "GAME INVITATIONS",
gameInvitationsDescription: "When someone invites you to play.",
appearance: "APPEARANCE",
interfaceColors: "Your interface colors",
themeName: "Pacova Neon",
themeDescription: "Dark background with neon accents",
chooseLanguage: "Choose your interface language.",
    },
  },
  fr: {
    translation: {
      settings: "Paramètres",
      account: "Compte",
      security: "Sécurité",
      preferences: "Préférences",
      language: "Langue",
      editProfile: "Modifier le profil",
      accountDescription: "Gérez les informations de votre profil.",
securityDescription: "Protégez votre compte avec l’authentification à deux facteurs.",
close2fa: "FERMER 2FA",
manage2fa: "GÉRER 2FA",
loggingOut: "DÉCONNEXION...",
logout: "SE DÉCONNECTER",
logoutError: "Échec de la déconnexion. Réessayez.",
preferencesDescription: "Choisissez les notifications que vous souhaitez recevoir.",
friendRequests: "DEMANDES D’AMIS",
friendRequestsDescription: "Lorsqu’une personne vous envoie une demande d’ami.",
gameInvitations: "INVITATIONS DE JEU",
gameInvitationsDescription: "Lorsqu’une personne vous invite à jouer.",
appearance: "APPARENCE",
interfaceColors: "Couleurs de votre interface",
themeName: "Pacova Neon",
themeDescription: "Fond sombre avec des accents néon",
chooseLanguage: "Choisissez la langue de votre interface.",
    },
  },
  ar: {
    translation: {
      settings: "الإعدادات",
      account: "الحساب",
      security: "الأمان",
      preferences: "التفضيلات",
      language: "اللغة",
      editProfile: "تعديل الملف الشخصي",
      accountDescription: "إدارة معلومات ملفك الشخصي.",
securityDescription: "احمِ حسابك باستخدام المصادقة الثنائية.",
close2fa: "إغلاق المصادقة الثنائية",
manage2fa: "إدارة المصادقة الثنائية",
loggingOut: "جارٍ تسجيل الخروج...",
logout: "تسجيل الخروج",
logoutError: "فشل تسجيل الخروج. حاول مرة أخرى.",
preferencesDescription: "اختر الإشعارات التي تريد تلقيها.",
friendRequests: "طلبات الصداقة",
friendRequestsDescription: "عندما يرسل إليك شخص طلب صداقة.",
gameInvitations: "دعوات اللعب",
gameInvitationsDescription: "عندما يدعوك شخص للعب.",
appearance: "المظهر",
interfaceColors: "ألوان الواجهة",
themeName: "Pacova Neon",
themeDescription: "خلفية داكنة مع ألوان نيون",
chooseLanguage: "اختر لغة الواجهة.",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  localStorage.setItem("language", language);

  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
});

export default i18n;