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
    surportSoonMessage: string;
    account: string;
    workspace: string;
    noSchedule: string;
    active: string;
    inactive: string;
    manualSend: string;
    notSet: string;
    nextSend: string;
    mailingList: string;
    sendMethod: string;
    accessible: string;
    channel: string;
    numberOfChannel: string;
    numberOfRepo: string;
    private: string;
    public: string;
    connected: string;
    disconnected: string;
    soonSend: string;
    ago: string;
    later: string;
    allStatus: string;
    message: string;
    reaction: string;
    commits: string;
    emailSentCount: string;
    emailSentMemberCount: string;
    increase: string;
    decrease: string;
    mainFeatures: string;
    connectionComplete: string;
    total: string;
    member: string;
    nonMember: string;
    collapse: string;
    more: string;
    viewDetails: string;
    mailStatus: {
      sending: string;
      delivered: string;
      failed: string;
    }
  };
  times:{
    day: string;
    hour: string;
    minute: string;
    second: string;
    weekly: string;
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
  dashboard: {
    title: string;
    description: string;
    connectionStatus: string;
    connectionStatusDescription: string;
    accessibleRepositories: string;
    accessibleChannels: string;
    targetManagement: string;
    targetManagementDescription: string;
    emailStatistics: string;
    emailStatisticsDescription: string;
    goToSettings: string;
    goToTargets: string;
    goToSentMail: string;
  };
  analytics: {
    title: string;
    description: string;
    noData: string;
    noDataDescription: string;
    thisWeekStatistics: string;
    checkDataCollectionPeriod: string;
    githubDevelopmentActivity: string;
    weeklyCommitStatus: string;
    recent8WeeksCommitStatus: string;
    developerCommitStatus: string;
    thisWeekDeveloperCommitStatus: string;
    caseDevelopmentStatus: string;
    thisWeekCaseDevelopmentStatus: string;
    slackCommunicationStatus: string;
    messageAndReactionActivity: string;
    recent8WeeksMessageAndReactionCountTrend: string;
    channelSummary: string;
    channels: string;
    noChannelData: string;
    newsletterStatus: string;
    emailSentTrend: string;
    recent4WeeksEmailSentTrend: string;
    averageMemberCount: string;
    lastWeekComparison: string;
    noChange: string;
    statsCard: {
      githubCommit: {
        label: string;
        subLabel: string;
      },
      slackMessage: {
        label: string;
        subLabel: string;
      },
      slackHighlight: {
        label: string;
        subLabel: string;
      },
      newsletterSent: {
        label: string;
        subLabel: string;
      },
    }
  };
  integrations: {
    title: string;
    description: string;
    connectionCompleteDescription: string;
    connectedAccount: string;
    accessibleRepositories: string;
    loadingRepositories: string;
    noAccessibleRepositories: string;
    workspace: string;
    connectedBot: string;
    channelList: string;
    collectDataTargetDescription1: string;
    collectDataTargetDescription2: string;
    loadingChannels: string;
    noAccessibleChannels: string;
    channelLeavePermissionRequired: string;
    clickToLeaveChannel: string;
    clickToJoinChannel: string;
    popupBlocked: string;
    popupBlockedDescription1: string;
    popupBlockedDescription2: string;
    popupBlockedDescription3: string;
    status: {
      connected: string;
      connecting: string;
      disconnecting: string;
      unauthorized: string;
      disconnected: string;
    };
    actions: {
      verify: string;
      settings: string;
      disconnect: string;
      connect: string;
    };
    github: {
      description: string;
      features: {
        commits: string;
        pullRequests: string;
        issues: string;
        contributors: string;
        reports: string;
      };
    };
    slack: {
      description: string;
      features: {
        messages: string;
        activity: string;
        engagement: string;
        insights: string;
        reports: string;
      };
    };
    help: {
      title: string;
      description: string;
      githubConnection: string;
      githubConnectionDescription1: string;
      githubConnectionDescription2: string;
      githubConnectionDescription3: string;
      slackConnection: string;
      slackConnectionDescription1: string;
      slackConnectionDescription2: string;
      slackConnectionDescription3: string;
      slackConnectionDescription4: string;
    };
  }
};