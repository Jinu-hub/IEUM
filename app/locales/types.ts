export type Translation = {
  home: {
    title: string;
    subtitle: string;
  };
  navigation: {
    en: string;
    kr: string;
    ja: string;
  };
  common: {
    confirmationComplete: string;
    confirmationFailed: string;
    loginFailed: string;
    retry: string;
    soonMessage: string;
  };
  join: {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription: string;
    title: string;
    description: string;
    name: string;
    email: string;
    password: string;
    passwordHint: string;
    confirmPassword: string;
    createAccount: string;
    alreadyHave: string;
    signIn: string;
    marketing: string;
    terms: string;
    tos: string;
    and: string;
    privacy: string;
    accountCreated: string;
    verifyEmail: string;
  };
  login: {
    title: string;
    description: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    loginButton: string;
    emailNotConfirmedTitle: string;
    emailNotConfirmedDesc: string;
    resendConfirmation: string;
    noAccount: string;
    signUp: string;
  };
  magicLink: {
    title: string;
    description: string;
    email: string;
    emailPlaceholder: string;
    sendButton: string;
    successMessage: string;
  };
  otpStart: {
    title: string;
    description: string;
    email: string;
    emailPlaceholder: string;
    sendButton: string;
  };
  otpComplete: {
    title: string;
    description: string;
    emailPlaceholder: string;
    submitButton: string;
  };
  newPassword: {
    title: string;
    description: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    updatePasswordButton: string;
  };
  forgotPassword: {
    title: string;
    description: string;
    email: string;
    emailPlaceholder: string;
    backToLogin: string;
    sendResetLink: string;
  };
  editProfile: {
    title: string;
    description: string;
    name: string;
    avatar: string;
    maxSize: string;
    allowedFormats: string;
    saveProfile: string;
    marketingConsent: string;
    profileUpdated: string;
  };
  changeEmail: {
    title: string;
    addEmailTitle: string;
    description: string;
    addEmailDescription: string;
    email: string;
    currentEmail: string;
    newEmail: string;
    emailUpdateProcessStarted: string;
  };
  changePassword: {
    title: string;
    addPasswordTitle: string;
    description: string;
    addPasswordDescription: string;
    newPassword: string;
    confirmNewPassword: string;
    successMessage: string;
    passwordRequirements: string;
    passwordRequirementsLength: string;
    passwordRequirementsUppercaseAndLowercase: string;
    passwordRequirementsNumber: string;
  };
  connectSocialAccounts: {
    title: string;
    description: string;
  };
  deleteAccount: {
    title: string;
    warning: string;
    confirmDelete: string;
    confirmIrreversible: string;
    deleteButton: string;
  };
  sidebar: {
    dashboard: string;
    overview: string;
    analytics: string;
    reports: string;
    test: string;
    settings: string;
    integrations: string;
    targets: string;
    mailList: string;
    contents: string;
    sentMail: string;
    user: {
      upgrade: string;
      account: string;
      payments: string;
      notifications: string;
      logout: string;
    }
  };
};