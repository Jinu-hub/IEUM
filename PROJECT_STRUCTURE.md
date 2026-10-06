# IEUM Project Structure

```
/Users/jinwoosmacair/developments/IEUM/
├── app/                                    # Main application directory
│   ├── app.css                            # Global styles
│   ├── entry.client.tsx                    # Client entry point
│   ├── entry.server.tsx                   # Server entry point
│   ├── i18n.ts                            # Internationalization configuration
│   ├── root.tsx                           # Root component
│   ├── routes.ts                          # Routing configuration
│   │
│   ├── core/                              # Core functionality
│   │   ├── components/                    # Shared components
│   │   │   ├── fetcher-form-button.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── form-button.tsx
│   │   │   ├── form-error.tsx
│   │   │   ├── form-success.tsx
│   │   │   ├── lang-switcher.tsx
│   │   │   ├── mdx-typography.tsx
│   │   │   ├── navigation-bar.tsx
│   │   │   ├── theme-switcher.tsx
│   │   │   │
│   │   │   ├── nex/                       # Nex design system components
│   │   │   │   ├── index.ts
│   │   │   │   ├── nex-avatar.tsx
│   │   │   │   ├── nex-badge.tsx
│   │   │   │   ├── nex-button.tsx
│   │   │   │   ├── nex-card.tsx
│   │   │   │   ├── nex-carousel.tsx
│   │   │   │   ├── nex-charts.tsx
│   │   │   │   ├── nex-footer.tsx
│   │   │   │   ├── nex-hero.tsx
│   │   │   │   ├── nex-icons.tsx
│   │   │   │   ├── nex-image-card.tsx
│   │   │   │   ├── nex-input.tsx
│   │   │   │   ├── nex-navbar.tsx
│   │   │   │   ├── nex-progress.tsx
│   │   │   │   └── nex-toggle.tsx
│   │   │   │
│   │   │   ├── samples/                   # Sample components
│   │   │   │   └── samples.tsx
│   │   │   │
│   │   │   └── ui/                        # UI components (shadcn/ui)
│   │   │       ├── alert.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── input-otp.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── table.tsx
│   │   │       ├── textarea.tsx
│   │   │       └── tooltip.tsx
│   │   │
│   │   ├── config/                        # Configuration files
│   │   │   ├── agents_back.txt
│   │   │   ├── agents_ko.yaml
│   │   │   ├── agents.yaml
│   │   │   ├── tasks_back.txt
│   │   │   ├── tasks_ko.yaml
│   │   │   └── tasks.yaml
│   │   │
│   │   ├── db/                            # Database related
│   │   │   ├── drizzle-client.server.ts
│   │   │   └── helpers.server.ts
│   │   │
│   │   ├── hooks/                         # Custom hooks
│   │   │   └── use-mobile.ts
│   │   │
│   │   ├── integrations/                  # External service integrations
│   │   │   ├── github/                    # GitHub integration
│   │   │   │   ├── back.txt
│   │   │   │   ├── client.ts
│   │   │   │   ├── config.ts
│   │   │   │   ├── fetch.ts
│   │   │   │   ├── fetchers.ts
│   │   │   │   ├── genReport.ts
│   │   │   │   ├── run.ts
│   │   │   │   ├── types.ts
│   │   │   │   ├── backup/
│   │   │   │   │   └── client.ts
│   │   │   │   └── tests/
│   │   │   │       ├── run-tests.ts
│   │   │   │       ├── unit-config.ts
│   │   │   │       └── unit-writer.ts
│   │   │   │
│   │   │   └── slack/                     # Slack integration
│   │   │       ├── back.txt
│   │   │       ├── client.ts
│   │   │       ├── config.ts
│   │   │       ├── fetch.ts
│   │   │       ├── fetchers.ts
│   │   │       ├── genReport.ts
│   │   │       ├── probe.ts
│   │   │       ├── run.ts
│   │   │       ├── types.ts
│   │   │       └── tests/
│   │   │           ├── fetchers.ts
│   │   │           ├── run-tests.ts
│   │   │           └── unit-config.ts
│   │   │
│   │   ├── layouts/                       # Layout components
│   │   │   ├── navigation.layout.tsx
│   │   │   ├── private.layout.tsx
│   │   │   └── public.layout.tsx
│   │   │
│   │   ├── lib/                           # Utility library
│   │   │   ├── analytics.client.ts
│   │   │   ├── constants.ts
│   │   │   ├── cron-utils.ts
│   │   │   ├── guards.server.ts
│   │   │   ├── i18next.server.ts
│   │   │   ├── i18next.ts
│   │   │   ├── logger.ts
│   │   │   ├── resend-client.server.ts
│   │   │   ├── secrets-manager.server.ts
│   │   │   ├── supa-admin-client.server.ts
│   │   │   ├── supa-client.server.ts
│   │   │   ├── theme-session.server.ts
│   │   │   ├── theme.ts
│   │   │   ├── types.ts
│   │   │   ├── utils.ts
│   │   │   └── writer.ts
│   │   │
│   │   ├── openai/                        # OpenAI related
│   │   │   ├── agents/                    # AI agents
│   │   │   │   ├── analyze-agents.ts
│   │   │   │   ├── drafting-agents.ts
│   │   │   │   └── reporting-agents.ts
│   │   │   │
│   │   │   ├── config/                    # Configuration
│   │   │   │   └── style-guide.ts
│   │   │   │
│   │   │   ├── formatters/                # Formatters
│   │   │   │   ├── github-formatter.ts
│   │   │   │   ├── keyword.en.ts
│   │   │   │   ├── keyword.ja.ts
│   │   │   │   └── keyword.ko.ts
│   │   │   │
│   │   │   ├── prompts/                   # Prompts
│   │   │   │   ├── analyze/               # Analysis prompts
│   │   │   │   │   ├── highlight_ins.ts
│   │   │   │   │   ├── ongoing_ins.ts
│   │   │   │   │   ├── topic_clustering_ins.ts
│   │   │   │   │   └── user_activity_ins.ts
│   │   │   │   │
│   │   │   │   ├── drafting/              # Draft prompts
│   │   │   │   │   ├── fun_corner_sec_ins.ts
│   │   │   │   │   ├── highlights_sec_ins.ts
│   │   │   │   │   ├── kpi_sec_ins_v1.ts
│   │   │   │   │   ├── kpi_sec_ins.ts
│   │   │   │   │   ├── member_act_sec_ins.ts
│   │   │   │   │   ├── ongoing_sec_ins.ts
│   │   │   │   │   └── topics_sec_ins.ts
│   │   │   │   │
│   │   │   │   ├── back_up/               # Backup
│   │   │   │   │   ├── convert_to_html copy.ts
│   │   │   │   │   ├── fun_corner_ins copy.ts
│   │   │   │   │   ├── fun_corner_ins.ts
│   │   │   │   │   ├── topic_ins.en.ts
│   │   │   │   │   ├── topic_ins.ja.ts
│   │   │   │   │   └── topic_ins.ko.ts
│   │   │   │   │
│   │   │   │   ├── convert_to_html_v0.2.ts
│   │   │   │   ├── convert_to_html.ts
│   │   │   │   ├── final_res_ins.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── prompt-builder.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   ├── templates/                 # Templates
│   │   │   │   ├── 0_base-template.en.ts
│   │   │   │   ├── 0_base-template.ja.ts
│   │   │   │   ├── 0_base-template.ko.ts
│   │   │   │   ├── 1_kpi-template.en.ts
│   │   │   │   ├── 2_main-template.en.ts
│   │   │   │   ├── 2_main-template.ja.ts
│   │   │   │   ├── 2_main-template.ko.ts
│   │   │   │   ├── activity_ins.ts
│   │   │   │   ├── github-template.en.ts
│   │   │   │   ├── github-template.ja.ts
│   │   │   │   ├── github-template.ko.ts
│   │   │   │   ├── html_template_v1_.ts
│   │   │   │   ├── html_template_v1.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── back_up/
│   │   │   │
│   │   │   ├── index.ts
│   │   │   ├── models.ts
│   │   │   ├── README.md
│   │   │   ├── sample-summary.ts
│   │   │   └── test-agent.ts
│   │   │
│   │   ├── processes/                     # Processes
│   │   │   ├── analyze-data.ts
│   │   │   ├── cross-linker.ts
│   │   │   ├── drafting-data.ts
│   │   │   ├── ingestors.ts
│   │   │   ├── mainProcess.ts
│   │   │   ├── reporting-data.ts
│   │   │   └── utils.ts
│   │   │
│   │   └── screens/                       # Common screens
│   │       ├── 404.tsx
│   │       ├── error.tsx
│   │       ├── robots.ts
│   │       └── sitemap.ts
│   │
│   ├── debug/                             # Debug
│   │   ├── analytics.tsx
│   │   └── sentry.tsx
│   │
│   ├── features/                          # Feature modules
│   │   ├── auth/                          # Authentication
│   │   │   ├── api/
│   │   │   │   └── resend.tsx
│   │   │   ├── components/
│   │   │   │   ├── auth-login-buttons.tsx
│   │   │   │   └── logos/
│   │   │   │       ├── apple.tsx
│   │   │   │       ├── github.tsx
│   │   │   │       ├── google.tsx
│   │   │   │       └── kakao.tsx
│   │   │   ├── lib/
│   │   │   │   └── queries.server.ts
│   │   │   └── screens/
│   │   │       ├── confirm.tsx
│   │   │       ├── email-verified.tsx
│   │   │       ├── forgot-password.tsx
│   │   │       ├── join.tsx
│   │   │       ├── login.tsx
│   │   │       ├── logout.tsx
│   │   │       ├── magic-link.tsx
│   │   │       ├── new-password.tsx
│   │   │       ├── otp/
│   │   │       │   ├── complete.tsx
│   │   │       │   └── start.tsx
│   │   │       └── social/
│   │   │           ├── complete.tsx
│   │   │           └── start.tsx
│   │   │
│   │   ├── blog/                          # Blog feature
│   │   │   ├── api/
│   │   │   │   └── og.tsx
│   │   │   ├── components/
│   │   │   │   └── counter-example.tsx
│   │   │   ├── docs/                      # MDX blog posts
│   │   │   │   ├── first.mdx
│   │   │   │   ├── hello-world.mdx
│   │   │   │   ├── product-update-march.mdx
│   │   │   │   └── react-router-opinion.mdx
│   │   │   ├── layouts/
│   │   │   │   └── blog.layout.tsx
│   │   │   └── screens/
│   │   │       ├── post.tsx
│   │   │       └── posts.tsx
│   │   │
│   │   ├── contact/                       # Contact feature
│   │   │   └── screens/
│   │   │       └── contact-us.tsx
│   │   │
│   │   ├── contents/                      # Content management
│   │   │   ├── db/
│   │   │   │   ├── mutations.ts
│   │   │   │   └── queries.ts
│   │   │   ├── lib/
│   │   │   │   ├── common.ts
│   │   │   │   ├── mackData.ts
│   │   │   │   └── types.ts
│   │   │   └── screens/
│   │   │       ├── sent-mail-detail.tsx
│   │   │       └── sent-mail.tsx
│   │   │
│   │   ├── cron/                          # Cron jobs
│   │   │   └── api/
│   │   │       ├── actions.tsx
│   │   │       ├── create-contents.tsx
│   │   │       ├── mailer.tsx
│   │   │       ├── send-mails.tsx
│   │   │       └── test-api.tsx
│   │   │
│   │   ├── home/                          # Home feature
│   │   │   └── screens/
│   │   │       ├── about.tsx
│   │   │       ├── faq.tsx
│   │   │       ├── home.tsx
│   │   │       ├── pricing.tsx
│   │   │       └── samples.tsx
│   │   │
│   │   ├── legal/                         # Legal documents
│   │   │   ├── docs/                      # MDX legal documents
│   │   │   │   ├── privacy-policy_en.mdx
│   │   │   │   ├── privacy-policy_ja.mdx
│   │   │   │   ├── privacy-policy_ko.mdx
│   │   │   │   ├── privacy-policy.mdx
│   │   │   │   ├── security-whitepaper_en.mdx
│   │   │   │   ├── security-whitepaper_ja.mdx
│   │   │   │   ├── security-whitepaper_ko.mdx
│   │   │   │   ├── terms-of-service_en.mdx
│   │   │   │   ├── terms-of-service_ja.mdx
│   │   │   │   ├── terms-of-service_ko.mdx
│   │   │   │   └── terms-of-service.mdx
│   │   │   └── screens/
│   │   │       └── policy.tsx
│   │   │
│   │   ├── payments/                      # Payment feature
│   │   │   ├── queries.ts
│   │   │   ├── schema.ts
│   │   │   └── screens/
│   │   │       ├── checkout.tsx
│   │   │       ├── failure.tsx
│   │   │       ├── payments.tsx
│   │   │       └── success.tsx
│   │   │
│   │   ├── schema.ts                      # Shared schema
│   │   │
│   │   ├── settings/                      # Settings feature
│   │   │   ├── api/
│   │   │   │   ├── common.ts
│   │   │   │   ├── github-callback.tsx
│   │   │   │   ├── github-integration.tsx
│   │   │   │   ├── github-webhook.tsx
│   │   │   │   ├── review-sample-data.tsx
│   │   │   │   ├── set-locale.tsx
│   │   │   │   ├── set-theme.tsx
│   │   │   │   ├── slack-callback.tsx
│   │   │   │   ├── slack-channel-members.tsx
│   │   │   │   ├── slack-integration.tsx
│   │   │   │   ├── update-review-step.tsx
│   │   │   │   └── token/
│   │   │   │       ├── github-integration.tsx
│   │   │   │       └── slack-integration.tsx
│   │   │   ├── components/
│   │   │   │   └── review-guide-tooltip.tsx
│   │   │   ├── db/
│   │   │   │   ├── backup/
│   │   │   │   │   └── github-installation-requests.ts
│   │   │   │   ├── mutations.ts
│   │   │   │   └── queries.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useIntegrationActions.ts
│   │   │   │   ├── useIntegrationResponse.ts
│   │   │   │   ├── useIntegrationSources.ts
│   │   │   │   └── useIntegrationUI.tsx
│   │   │   ├── lib/
│   │   │   │   ├── common.ts
│   │   │   │   ├── constants.ts
│   │   │   │   ├── github/
│   │   │   │   │   └── data-utils.ts
│   │   │   │   ├── JsonUtils.ts
│   │   │   │   ├── mockdata.ts
│   │   │   │   ├── scheduleUtils.ts
│   │   │   │   └── types.ts
│   │   │   └── screens/
│   │   │       ├── integrations-review.tsx
│   │   │       ├── integrations.tsx
│   │   │       ├── mail-list-members.tsx
│   │   │       ├── mail-list.tsx
│   │   │       ├── target-detail.tsx
│   │   │       └── targets.tsx
│   │   │
│   │   └── users/                         # User feature
│   │       ├── api/
│   │       │   ├── change-email.tsx
│   │       │   ├── change-password.tsx
│   │       │   ├── connect-provider.tsx
│   │       │   ├── delete-account.tsx
│   │       │   ├── disconnect-provider.tsx
│   │       │   └── edit-profile.tsx
│   │       ├── components/
│   │       │   ├── connect-provider-buttons.tsx
│   │       │   ├── dashboard-sidebar.tsx
│   │       │   ├── forms/
│   │       │   │   ├── change-email-form.tsx
│   │       │   │   ├── change-password-form.tsx
│   │       │   │   ├── connect-social-accounts-form.tsx
│   │       │   │   ├── delete-account-form.tsx
│   │       │   │   └── edit-profile-form.tsx
│   │       │   ├── sidebar-main.tsx
│   │       │   ├── sidebar-projects.tsx
│   │       │   ├── sidebar-team-switcher.tsx
│   │       │   └── sidebar-user.tsx
│   │       ├── layouts/
│   │       │   └── dashboard.layout.tsx
│   │       ├── lib/
│   │       │   ├── constants.ts
│   │       │   ├── mockdata.ts
│   │       │   ├── types.ts
│   │       │   └── utils.ts
│   │       ├── queries.ts
│   │       ├── schema.ts
│   │       └── screens/
│   │           ├── account.tsx
│   │           ├── analytics.tsx
│   │           ├── dashboard.tsx
│   │           └── test1.tsx
│   │
│   └── locales/                           # Internationalization resources
│       ├── en.ts                          # English
│       ├── ja.ts                          # Japanese
│       ├── ko.ts                          # Korean
│       └── types.ts                       # Type definitions
│
├── components.json                        # shadcn/ui configuration
├── database.types.ts                      # Database type definitions
├── drizzle.config.ts                      # Drizzle ORM configuration
├── instrument.server.mjs                  # Server instrumentation
├── LICENSE.md                             # License
├── package.json                           # Dependencies
├── package-lock.json                      # Dependency lock
├── playwright.config.ts                   # Playwright configuration
├── react-router.config.ts                # React Router configuration
├── README.md                              # Project description
├── tsconfig.json                          # TypeScript configuration
├── vite.config.ts                         # Vite configuration
│
├── docs/                                  # Documentation
│   └── SUPABASE_SECRETS_SETUP.md
│
├── e2e/                                   # E2E tests
│   ├── assets/
│   │   └── avatar-test.jpg
│   ├── auth/
│   │   ├── forgot-password.spec.ts
│   │   ├── join.spec.ts
│   │   ├── login.spec.ts
│   │   └── magic-link.spec.ts
│   ├── settings/
│   │   └── settings.spec.ts
│   ├── users/
│   │   ├── change-email.spec.ts
│   │   ├── change-password.spec.ts
│   │   ├── delete-profile.spec.ts
│   │   └── edit-profile.spec.ts
│   └── utils/
│       └── test-helpers.ts
│
├── output/                                # Output files (production)
│   ├── github_raw.json
│   ├── github_report_2025-08-22.md
│   ├── slack_raw.json
│   └── slack_report.md
│
├── output-sample/                         # Sample output files
│   ├── final_contents_*.md               # Final contents (multiple)
│   ├── final_contents_html_*.html        # HTML contents (multiple)
│   ├── merged_contents_*.md
│   ├── test_output.ts
│   ├── fun/
│   │   └── fun_corner_section_*.md
│   ├── highlights/
│   │   └── *.md
│   ├── kpi/
│   │   └── *.md
│   ├── member/
│   │   └── *.md
│   ├── ongoing/
│   │   └── *.md
│   └── topics/
│       └── *.md
│
├── output-test/                           # Test output files
│   ├── .....
│   ├── .....
│   └── .....
│
├── public/                                 # Static files
│   ├── blog/                              # Blog images
│   │   └── *.jpg                          # Image files (4 files)
│   ├── favicon.ico
│   ├── memo.mdx
│   ├── nft-2.jpg
│   ├── nft.jpg
│   └── scripts/
│       └── *.js
│
├── scripts/                               # Scripts
│   └── migrate-to-secrets.ts
│
├── sql/                                   # SQL files
│   ├── functions/                         # Database functions
│   │   ├── handle_sign_up.sql
│   │   ├── set_updated_at.sql
│   │   ├── vault_secret.sql
│   │   └── welcome_email.sql
│   ├── indexes/                           # Indexes
│   │   └── jin_indexes.sql
│   ├── migrations/                        # Migrations
│   │   ├── 0000_worried_vision.sql
│   │   ├── 0001_great_junta.sql
│   │   ├── 0002_lame_tana_nile.sql
│   │   ├── ...                            # Continues to 0003-0020
│   │   └── meta/                          # Migration metadata
│   │       ├── _journal.json
│   │       └── 0000_snapshot.json ~ 0020_snapshot.json
│   └── views/                             # Views
│       ├── integration_info.sql
│       └── integration_is_connedted.sql
│
├── supabase/                              # Supabase configuration
│   ├── config.toml
│   └── functions/                         # Edge Functions
│       ├── deno.d.ts
│       ├── tsconfig.json
│       └── manage-secrets/
│           └── index.ts
│
└── transactional-emails/                  # Transactional emails
    ├── emails/
    │   ├── change-email.tsx
    │   ├── confirm-email.tsx
    │   ├── magic-link.tsx
    │   ├── reset-password.tsx
    │   └── welcome.tsx
    ├── package.json
    └── package-lock.json
```

## Main Directory Descriptions

### `/app` - Main Application
- **core/**: Shared components, utilities, integration features
- **features/**: Feature modules (authentication, blog, settings, etc.)
- **locales/**: Multi-language resources

### `/app/core`
- **components/**: Reusable components (Nex design system, UI components)
- **integrations/**: External service integrations (GitHub, Slack, etc.)
- **openai/**: AI agents, prompts, templates
- **processes/**: Data processing pipeline

### `/app/features`
Each feature is organized as an independent module:
- **auth/**: Authentication & authorization
- **blog/**: Blog feature
- **contents/**: Content management
- **settings/**: Settings & integration management
- **users/**: User management

### `/sql` - Database
- **migrations/**: Database schema change history
- **functions/**: PostgreSQL functions
- **views/**: Database views

### `/e2e` - Tests
E2E tests using Playwright

### `/output*` - Output Files
Generated content, reports, test data

