export type Translation = {
  home: {
    title: string;
    subtitle: string;
    hero: {
      description: string;
      subscribeButton: string;
      sampleButton: string;
    };
    featureHighlights: {
      autoDataCollection: {
        title: string;
        description: string;
      };
      aiSummary: {
        title: string;
        description: string;
      };
      autoNewsletter: {
        title: string;
        description: string;
      };
    };
    integrations: {
      badge: string;
      title: string;
      description: string;
      connected: string;
      comingSoon: string;
      slack: {
        name: string;
        description: string;
      };
      github: {
        name: string;
        description: string;
      };
      discord: {
        name: string;
        description: string;
      };
      moreIntegrations: {
        name: string;
        description: string;
      };
    };
    analytics: {
      badge: string;
      title: string;
      description: string;
      dashboardTitle: string;
      dashboardSubtitle: string;
      preview: string;
      commitTrend: string;
      developerActivity: string;
      caseStatus: string;
      viewDashboard: string;
      stagedRelease: string;
      features: {
        githubActivity: {
          title: string;
          description: string;
        };
        slackCommunication: {
          title: string;
          description: string;
        };
        newsletterPerformance: {
          title: string;
          description: string;
        };
        projectStatus: {
          title: string;
          description: string;
        };
      };
    };
    teamHighlights: {
      badge: string;
      title: string;
      description: string;
      weeklyAchievement: {
        title: string;
        subtitle: string;
        commits: string;
        prMerged: string;
        participants: string;
      };
      teamCommunication: {
        title: string;
        subtitle: string;
        channel1: string;
        channel1Description: string;
        channel2: string;
        channel2Description: string;
        channel3: string;
        channel3Description: string;
      };
      latestNewsletter: {
        title: string;
        subtitle: string;
        mainTopics: string;
        participants: string;
        summary: string;
        sampleMainTopic: string;
        sampleSummary: string;
      };
      codeQuality: {
        title: string;
        subtitle: string;
        testCoverage: string;
        qualityScore: string;
        bugFixes: string;
      };
      teamProductivity: {
        title: string;
        subtitle: string;
        commits: string;
        prCreated: string;
        prMerged: string;
        vsLastWeek: string;
      };
      topicsOfTheWeek: {
        title: string;
        subtitle: string;
        topic1Title: string;
        topic1Description: string;
        topic2Title: string;
        topic2Description: string;
        topic3Title: string;
        topic3Description: string;
      };
      roadmap: {
        title: string;
        subtitle: string;
        project1Title: string;
        project1Progress: string;
        project1Status: string;
        project2Title: string;
        project2Schedule: string;
        project2Status: string;
        project3Title: string;
        project3Schedule: string;
        project3Status: string;
        inProgress: string;
        planned: string;
        scheduled: string;
        progress: string;
      };
    };
    individualActivity: {
      badge: string;
      title: string;
      description: string;
      commits: string;
      prReviews: string;
      messages: string;
      metricCases: string;
      metricReactions: string;
      contribution: string;
      viewAllTeamActivity: string;
      dashboardNote: string;
    };
    cta: {
      badge: string;
      title: string;
      description: string;
      getStarted: string;
      viewSamples: string;
    };
  };
  navigation: {
    en: string;
    kr: string;
    ja: string;
    links: {
      about: string;
      blog: string;
      faq: string;
      pricing: string;
      contact: string;
    };
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
    count: string;
    people: string;
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
    add: string;
    edit: string;
    delete: string;
    copy: string;
    clickToDeactivate: string;
    clickToActivate: string;
    schedule: string;
    sendTarget: string;
    lastSent: string;
    back: string;
    saving: string;
    save: string;
    basicInfo: string;
    category: string;
    selectCategory: string;
    targetName: string;
    activeStatus: string;
    dataSources: string;
    repository: string;
    memberMail: string;
    notSupport: string;
    source: string;
    numberOfMailLists: string;
    memberCount: string;
    numberOfMembers: string;
    createdAt: string;
    joinedAt: string;
    tags: string;
    email: string;
    name: string;
    optional: string;
    noTitle: string;
    noDescription: string;
    cancel: string;
    confirm: string;
    csvUpload: string;
    csvDownload: string;
    comingSoon: string;
    contactTitle: string;
    contactDescription: string;
    addMember: string;
    editMember: string;
    noMembers: string;
    addFirstMember: string;
    preview: string;
    download: string;
    code: string;
    newsletterLanguage: string;
    selectLanguage: string;
    mail: {
      numberOfEmails: string;
      statuses: string;
      target: string;
      subject: string;
      sentAt: string;
      messageId: string;
      resend: string;
      idCopy: string;
      copied: string;
      archive: string;
      emailEvent: string;
      previewEmail: string;
      status: {
        sending: string;
        delivered: string;
        failed: string;
        partial: string;
        unknown: string;
      };
      result: string;
    };
    categories: {
      development: string;
      infrastructure: string;
      qa: string;
      data_ai: string;
      product: string;
      design: string;
      operations: string;
      communication: string;
      community: string;
      learning: string;
      business: string;
      finance: string;
      hr: string;
      okr: string;
      personal: string;
      fun: string;
    };
    sources: {
      signup_form: string;
      import: string;
      api: string;
      manual: string;
    };
  };
  times:{
    day: string;
    hour: string;
    minute: string;
    second: string;
    weekly: string;
    schedule: {
      type: string;
      sendDay: string;
      sendTime: string;
      preview: string;
      manual: string;
      weekly: string;
      daily: string;
      monthly: string;
      day: string;
      hour: string;
      minute: string;
      comingSoon: string;
      timeRange: string;
      weeklyFormat: string;
      dailyFormat: string;
      monthlyFormat: string;
      daysOfWeek: {
        sunday: string;
        monday: string;
        tuesday: string;
        wednesday: string;
        thursday: string;
        friday: string;
        saturday: string;
      };
    };
    time: {
      notSent: string;
      minutesAgo: string;
      hoursAgo: string;
      daysAgo: string;
      weeksAgo: string;
      justNow: string;
    };
  };
  errors: {
    saveError: string;
    targetNameRequired: string;
    emailRequired: string;
    invalidEmail: string;
  };
  searches: {
    searchMailList: string;
    noSearchResult: string;
    noSearchResultDescription: string;
    resetSearch: string;
    searchMember: string;
    searchSentMailList: string;
  };
  join: {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription: string;
    title: string;
    description: string;
    noticeMessage: string;
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
  planInfo: {
    title: string;
    description: string;
    status: {
      trialing: string;
      active: string;
      paused: string;
      expired: string;
      canceled: string;
    };
    trialRemaining: string;
    validUntil: string;
    upgradeToStarter: string;
    startDate: string;
    trialEndDate: string;
    nextRenewalDate: string;
    planEndDate: string;
    upgradePrompt: {
      title: string;
      description: string;
    };
    renewPrompt: {
      title: string;
      description: string;
    };
    comparePlans: string;
    managePayments: string;
    cancelSubscription: string;
    renewSubscription: string;
    cancelDialog: {
      title: string;
      monthlyWarning: string;
      yearlyWarning: string;
      validUntil: string;
      monthlyNoRefund: string;
      refundDetails: {
        title: string;
        yearlyAmount: string;
        usedMonths: string;
        monthsUnit: string;
        deduction: string;
        refundAmount: string;
      };
      buttons: {
        cancel: string;
        confirm: string;
      };
      success: {
        withRefund: string;
        noRefund: string;
      };
    };
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
    templates: string;
    mailList: string;
    contents: string;
    sentMail: string;
    user: {
      upgrade: string;
      upgradeToStarter: string;
      renewSubscription: string;
      upgradeToPro: string;
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
    connectGitHubAccount: string;
    connectSlackWorkspace: string;
  };
  analytics: {
    title: string;
    description: string;
    targetAll: string;
    targetLabel: string;
    noData: string;
    noDataDescription: string;
    noDataDescription2: string;
    thisWeekStatistics: string;
    checkDataCollectionPeriod: string;
    githubDevelopmentActivity: string;
    weeklyCommitStatus: string;
    recent8WeeksCommitStatus: string;
    developerCommitStatus: string;
    thisWeekDeveloperCommitStatus: string;
    caseDevelopmentStatus: string;
    thisWeekCaseDevelopmentStatus: string;
    commitKind: {
      Incident: string;
      Release: string;
      Bugfix: string;
      Security: string;
      Refactor: string;
      Feature: string;
    };
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
  targets: {
    title: string;
    description: string;
    numberOfTargets: string;
    noTargets: string;
    addFirstTarget: string;
    addTarget: string;
    memberMailIncluded: string;
    targetDeletedSuccess: string;
    targetDeletedFailed: string;
    confirmDeleteTarget: string;
    targetLimitReached: string;
    targetLimitReachedTrial: string;
    emailLimitReached: string;
    emailLimitReachedAfter: string;
    detail: {
      addTarget: string;
      editTarget: string;
      description: string;
      soonSupportOtherCategory: string;
      enterTargetName: string;
      selectMailingList: string;
      memberMailStatus: string;
      memberMailStatusDescription: string;
      scheduleTypeDescription: string;
      manualDescription: string;
      addDataSource: string;
      connectedService: string;
      selectConnectedService: string;
      noConnectedService: string;
      selectService: string;
      selectSource: string;
      noAvailableSource: string;
      disconnectedService: string;
      goToSettings: string;
      botInvitationRequired: string;
      inviteBotToChannel: string;
      availableChannelCandidate: string;
      availableChannelCandidateDescription: string;
      invitationRequired: string;
      botInvitationMethod: string;
      botInvitationMethodDescription1: string;
      botInvitationMethodDescription2: string;
      botInvitationMethodDescription3: string;
      botName: string;
      githubRepoLimitReached: string;
      slackChannelLimitReached: string;
      messages: {
        targetSaved: string;
        sourcesConnected: string;
        someSourcesFailed: string;
      };
      errors: {
        invalidActionType: string;
        saveError: string;
        invalidDataFormat: string;
        duplicateData: string;
      };
    };
  };
  mailLists: {
    title: string;
    description: string;
    noMailLists: string;
    addFirstMailList: string;
    addMailList: string;
    mailListDeletedSuccess: string;
    mailListDeletedFailed: string;
    mailListSavedSuccess: string;
    mailListMemberSavedSuccess: string;
    mailListMemberSavedFailed: string;
    confirmCancelContinue: string;
    mailListMemberDeletedSuccess: string;
    mailListMemberDeletedFailed: string;
    confirmDeleteMailList: string;
    detail: {
      mailListInformationSaveFirst: string;
      memberInformationEdit: string;
      newMemberAdd: string;
      memberAddBeforeMailListNameSave: string;
      selectedMemberCount: string;
      deleteSelectedMembers: string;
      confirmDeleteMember: string;
      confirmDeleteSelectedMembers: string;
      noMailListFound: string;
      noMailListFoundDescription: string;
      goBackToMailList: string;
      newMailList: string;
      mailListManagement: string;
      mailListInputAndMemberManagement: string;
      mailListMemberManagement: string;
      mailListName: string;
      exampleMailListName: string;
      description: string;
      exampleDescription: string;
    };
  };
  sentMail: {
    title: string;
    description: string;
    noSentMail: string;
    noSentMailDescription: string;
    detail: {
      noSentMail: string;
      noSentMailDescription: string;
      mailDetail: string;
      previewEmailDescription: string;
    };
  };
  faq: {
    title: string;
    subtitle: string;
    description: string;
    heroDescription: string;
    contactButton: string;
    startTrialButton: string;
    quickStats: {
      fastResponse: {
        value: string;
        label: string;
        description: string;
      };
      realQuestions: {
        value: string;
        label: string;
        description: string;
      };
      earlyUsers: {
        value: string;
        label: string;
        description: string;
      };
    };
    categoryBadge: string;
    categoryTitle: string;
    categoryDescription: string;
    questionsCount: string;
    recommendedResources: {
      title: string;
      description: string;
      links: {
        pricing: {
          title: string;
          description: string;
        };
        security: {
          title: string;
          description: string;
        };
        samples: {
          title: string;
          description: string;
        };
      };
    };
    cta: {
      badge: string;
      title: string;
      description: string;
      startButton: string;
      contactButton: string;
    };
    categories: {
      onboarding: {
        name: string;
        description: string;
        questions: {
          service: {
            question: string;
            answer: string;
          };
          trial: {
            question: string;
            answer: string;
          };
          duration: {
            question: string;
            answer: string;
          };
          usage: {
            question: string;
            answer: string;
          };
        };
      };
      integration: {
        name: string;
        description: string;
        questions: {
          dataCollection: {
            question: string;
            answer: string;
          };
          dataStorage: {
            question: string;
            answer: string;
          };
          sensitiveData: {
            question: string;
            answer: string;
          };
        };
      };
      ai: {
        name: string;
        description: string;
        questions: {
          summary: {
            question: string;
            answer: string;
          };
          delivery: {
            question: string;
            answer: string;
          };
          dashboard: {
            question: string;
            answer: string;
          };
        };
      };
      security: {
        name: string;
        description: string;
        questions: {
          protection: {
            question: string;
            answer: string;
          };
          externalTransfer: {
            question: string;
            answer: string;
          };
        };
      };
      pricing: {
        name: string;
        description: string;
        questions: {
          plans: {
            question: string;
            answer: string;
          };
          recipients: {
            question: string;
            answer: string;
          };
        };
      };
      automation: {
        name: string;
        description: string;
        questions: {
          schedule: {
            question: string;
            answer: string;
          };
          filtering: {
            question: string;
            answer: string;
          };
        };
      };
      support: {
        name: string;
        description: string;
        questions: {
          help: {
            question: string;
            answer: string;
          };
          feedback: {
            question: string;
            answer: string;
          };
        };
      };
      advanced: {
        name: string;
        description: string;
        questions: {
          dataSources: {
            question: string;
            answer: string;
          };
          features: {
            question: string;
            answer: string;
          };
        };
      };
    };
  };
  pricing: {
    title: string;
    subtitle: string;
    description: string;
    hero: {
      title: string;
      subtitle: string;
      description: string;
      primaryButton: string;
      secondaryButton: string;
    };
    badge: string;
    billing: {
      toggleLabel: string;
      monthlyLabel: string;
      annualLabel: string;
      monthlyPayment: string;
      annualPayment: string;
      perMonth: string;
      totalFor12Months: string;
      saveAmount: string;
    };
    plans: {
      free: {
        name: string;
        description: string;
        seats: string;
        bestFor: string;
        features: string[];
        cta: string;
      };
      starter: {
        name: string;
        description: string;
        seats: string;
        bestFor: string;
        badge: string;
        features: string[];
        cta: string;
      };
      pro: {
        name: string;
        description: string;
        seats: string;
        bestFor: string;
        badge: string;
        features: string[];
        cta: string;
      };
    };
    comparison: {
      title: string;
      description: string;
      feature: string;
      free: string;
      starter: string;
      pro: string;
      rows: {
        duration: {
          label: string;
          free: string;
          starter: string;
          pro: string;
        };
        services: {
          label: string;
          free: string;
          starter: string;
          pro: string;
        };
        targets: {
          label: string;
          free: string;
          starter: string;
          pro: string;
        };
        dataSources: {
          label: string;
          free: string;
          starter: string;
          pro: string;
        };
        tone: {
          label: string;
          free: string;
          starter: string;
          pro: string;
        };
        template: {
          label: string;
          free: string;
          starter: string;
          pro: string;
        };
        recipients: {
          label: string;
          free: string;
          starter: string;
          pro: string;
        };
      };
    };
    roi: {
      title: string;
      description: string;
      stats: {
        timeSaving: string;
        reach: string;
        satisfaction: string;
      };
    };
    enterprise: {
      title: string;
      description: string;
      features: string[];
      cta: string;
    };
    faq: {
      title: string;
      description: string;
      questions: {
        trial: {
          question: string;
          answer: string;
        };
        overage: {
          question: string;
          answer: string;
        };
        frequency: {
          question: string;
          answer: string;
        };
        change: {
          question: string;
          answer: string;
        };
      };
      refundPolicyLink: string;
    };
    cta: {
      badge: string;
      title: string;
      description: string;
      startButton: string;
      contactButton: string;
    };
  };
  about: {
    title: string;
    subtitle: string;
    description: string;
    hero: {
      description: string;
      primaryButton: string;
      secondaryButton: string;
    };
    highlights: {
      story: {
        title: string;
        description: string;
      };
      ai: {
        title: string;
        description: string;
      };
      space: {
        title: string;
        description: string;
      };
    };
    painPoints: {
      badge: string;
      title: string;
      description: string;
      items: {
        tracking: {
          title: string;
          description: string;
          detail: string;
        };
        scattered: {
          title: string;
          description: string;
          detail: string;
        };
        manual: {
          title: string;
          description: string;
          detail: string;
        };
        context: {
          title: string;
          description: string;
          detail: string;
        };
      };
    };
    solution: {
      badge: string;
      title: string;
      description: string;
      intro: string;
      points: string[];
      conclusion: string;
    };
    storytelling: {
      title: string;
      description: string;
      steps: {
        collect: {
          title: string;
          description: string;
        };
        meaning: {
          title: string;
          description: string;
        };
        summarize: {
          title: string;
          description: string;
        };
        reconstruct: {
          title: string;
          description: string;
        };
      };
    };
    value: {
      badge: string;
      title: string;
      description: string;
      items: {
        time: {
          title: string;
          description: string;
        };
        flow: {
          title: string;
          description: string;
        };
        risk: {
          title: string;
          description: string;
        };
        spread: {
          title: string;
          description: string;
        };
        free: {
          title: string;
          description: string;
        };
      };
    };
    howItWorks: {
      badge: string;
      title: string;
      description: string;
      steps: {
        connect: {
          step: string;
          title: string;
          description: string;
          detail: string;
        };
        understand: {
          step: string;
          title: string;
          description: string;
          detail: string;
        };
        generate: {
          step: string;
          title: string;
          description: string;
          detail: string;
        };
        share: {
          step: string;
          title: string;
          description: string;
          detail: string;
        };
      };
    };
    security: {
      badge: string;
      title: string;
      description: string;
      footer: string;
      promises: {
        oauth: {
          title: string;
          description: string;
        };
        tls: {
          title: string;
          description: string;
        };
        vault: {
          title: string;
          description: string;
        };
        minimal: {
          title: string;
          description: string;
        };
        privacy: {
          title: string;
          description: string;
        };
      };
    };
    philosophy: {
      badge: string;
      intro: string;
      statements: string[];
      conclusion: string;
    };
    team: {
      title: string;
      description: string;
      intro: string;
      points: string[];
    };
    roadmap: {
      title: string;
      description: string;
      items: string[];
    };
    cta: {
      badge: string;
      title: string;
      description: string;
      startButton: string;
      loginButton: string;
      samplesButton: string;
    };
  };
  onboarding: {
    badge: string;
    skip: string;
    steps: {
      welcome: {
        title: string;
        description: string;
      };
      setup_integrations: {
        title: string;
        description: string;
      };
      setup_mailing_list: {
        title: string;
        description: string;
      };
      setup_targets: {
        title: string;
        description: string;
      };
      first_mail_sending: {
        title: string;
        description: string;
      };
      completed: {
        title: string;
        description: string;
      };
    };
    progressSteps: {
      welcome: string;
      setup_integrations: string;
      setup_mailing_list: string;
      setup_targets: string;
      first_mail_sending: string;
      completed: string;
    };
    integrationsSubSteps: {
      start: string;
      connect_github: string;
      connect_slack: string;
      setup_slack_channel: string;
      end: string;
      skip: string;
      completeStep: string;
      progressLabel: string;
      "start.title": string;
      "start.description": string;
      "connect_github.title": string;
      "connect_github.description": string;
      "connect_slack.title": string;
      "connect_slack.description": string;
      "setup_slack_channel.title": string;
      "setup_slack_channel.description": string;
      "end.title": string;
      "end.description": string;
    };
    mailingListSubSteps: {
      start: string;
      regist_basic: string;
      regist_address: string;
      end: string;
      progressLabel: string;
      "start.title": string;
      "start.description": string;
      "regist_basic.title": string;
      "regist_basic.description": string;
      "regist_address.title": string;
      "regist_address.description": string;
      "end.title": string;
      "end.description": string;
    };
    targetsSubSteps: {
      start: string;
      regist_basic: string;
      regist_schedule: string;
      regist_sourses: string;
      end: string;
      complete: string;
      progressLabel: string;
      "start.title": string;
      "start.description": string;
      "regist_basic.title": string;
      "regist_basic.description": string;
      "regist_schedule.title": string;
      "regist_schedule.description": string;
      "regist_sourses.title": string;
      "regist_sourses.description": string;
      "end.title": string;
      "end.description": string;
    };
    selection: {
      title: string;
      mailingList: {
        title: string;
        description: string;
      };
      targets: {
        title: string;
        description: string;
      };
    };
    firstMail: {
      title: string;
      description: string;
      sendNow: string;
      waitSchedule: string;
      scheduleInfo: string;
    };
    goTo: {
      welcome: string;
      setup_integrations: string;
      setup_mailing_list: string;
      setup_targets: string;
      first_mail_sending: string;
      completed: string;
    };
    dashboard: {
      welcomeBanner: string;
      goToSettings: string;
    };
    integrations: {
      connectGithubPrompt: string;
      connectSlackPrompt: string;
      skipAndContinue: string;
      selectNextStep: string;
      continueToNextStep: string;
    };
    mailList: {
      addListPrompt: string;
      afterSavePrompt: string;
      goToTargets: string;
    };
    targets: {
      addTargetPrompt: string;
      afterSavePrompt: string;
    };
  };
  processingStatus: {
    title: string;
    titleCompleted: string;
    errorBadge: string;
    completedBadge: string;
    retryMessage: string;
    steps: {
      collect_data: {
        label: string;
        description: string;
      };
      summarize_data: {
        label: string;
        description: string;
      };
      assemble_data: {
        label: string;
        description: string;
      };
      finalize_data: {
        label: string;
        description: string;
      };
      send_email: {
        label: string;
        description: string;
      };
    };
    onboardingComplete: {
      title: string;
      description: string;
    };
  };
  howItWorks: {
    meta: { title: string; description: string };
    hero: {
      title: string;
      subtitle: string;
      description: string;
      primaryButton: string;
      secondaryButton: string;
    };
    steps: {
      badge: string;
      title: string;
      description: string;
      items: {
        connect: { step: string; title: string; description: string; detail: string };
        configure: { step: string; title: string; description: string; detail: string };
        generate: { step: string; title: string; description: string; detail: string };
        share: { step: string; title: string; description: string; detail: string };
      };
    };
    integrations: {
      badge: string;
      title: string;
      description: string;
      slack: { title: string; description: string; features: string[] };
      github: { title: string; description: string; features: string[] };
    };
    slackSetup: {
      badge: string;
      title: string;
      description: string;
      features: {
        workspace: { title: string; description: string };
        channels: { title: string; description: string };
        readonly: { title: string; description: string };
      };
      connectionTitle: string;
      connectionDescription: string;
      steps: string[];
      note: string;
    };
    legal: {
      badge: string;
      title: string;
      support: { title: string; description: string; contact: string };
      privacy: { title: string; description: string; link: string };
    };
    preview: {
      title: string;
      description: string;
      slides: {
        "1_login": { title: string; description: string };
        "2_connect": { title: string; description: string };
        "3_configure": { title: string; description: string };
        "4_finish": { title: string; description: string };
        "5_generate": { title: string; description: string };
        "6_after_mail": { title: string; description: string };
        "7_analytics": { title: string; description: string };
      };
    };
    cta: {
      badge: string;
      title: string;
      description: string;
      startButton: string;
      aboutButton: string;
      samplesButton: string;
    };
  };
  footer: {
    brand: {
      description: string;
    };
    links: {
      product: {
        title: string;
        items: {
          samples: string;
          howItWorks: string;
          pricing: string;
          sitemap: string;
          sitemapTooltip: string;
        };
      };
      info: {
        title: string;
        items: {
          about: string;
          blog: string;
        };
      };
      support: {
        title: string;
        items: {
          faq: string;
          contact: string;
          community: string;
          communityTooltip: string;
        };
      };
      legal: {
        title: string;
        items: {
          privacyPolicy: string;
          termsOfService: string;
          securityWhitepaper: string;
        };
      };
    };
  };
  billing: {
    country: {
      title: string;
      description: string;
      comingSoon: string;
      comingSoonMessage: string;
      comingSoonSubMessage: string;
      continueToPayment: string;
      backToPlans: string;
      backToDashboard: string;
      infoNote: string;
    };
    checkout: {
      title: string;
      description: string;
      intervalToggle: {
        monthly: string;
        yearly: string;
        save: string;
      };
      plan: string;
      price: {
        perMonth: string;
        perYear: string;
        monthlyEquivalent: string;
      };
      includes: string;
      features: {
        starter: string[];
        pro: string[];
      };
      renewalNotice: string;
      cardRegistration: {
        title: string;
        description: string;
      };
      security: {
        encryption: string;
        pciCompliant: string;
        cancelAnytime: string;
      };
      subscribeButton: string;
      processing: string;
      termsNotice: string;
      paymentError: string;
    };
    success: {
      title: string;
      description: string;
      subscriptionDetails: string;
      plan: string;
      billingCycle: string;
      amount: string;
      nextBillingDate: string;
      orderId: string;
      annual: string;
      monthly: string;
      goToDashboard: string;
      viewReceipt: string;
    };
    failure: {
      title: string;
      description: string;
      errorDetails: string;
      errorCode: string;
      helpText: string;
      tryAgain: string;
      backToPlans: string;
      backToDashboard: string;
      errorMessages: {
        invalid_params: string;
        auth_error: string;
        billing_key_error: string;
        payment_error: string;
        validation_error: string;
        db_error: string;
        REJECT_CARD_COMPANY: string;
        EXCEED_MAX_DAILY_PAYMENT_COUNT: string;
        NOT_SUPPORTED_INSTALLMENT_PLAN: string;
        INVALID_CARD_EXPIRATION: string;
        INVALID_STOPPED_CARD: string;
        INSUFFICIENT_BALANCE: string;
        unknown_error: string;
      };
    };
    history: {
      noPayments: string;
      tableCaption: string;
      orderId: string;
      status: string;
      product: string;
      amount: string;
      date: string;
      receipt: string;
      viewReceipt: string;
    };
  };
};