import {
  Button,
  Column,
  Head,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

type Locale = "en" | "ja" | "ko";

interface WelcomeUserProps {
  username?: string;
  locale?: Locale;
}

// 言語ごとのテキストを定義
export type WelcomeMessage = {
  preview: (username: string) => string;
  heading: (username: string) => string;
  greeting: (username: string) => string;
  experience: string;
  quote: string;
  introduction: string;
  description: string;
  button: string;
  footer: string;
};

// welcome email messages
export const welcomeMessages: Record<Locale, WelcomeMessage> = {
  ko: {
    preview: (username) =>
      `${username}님, IEUM에 오신 걸 환영합니다!`,
    heading: (username) =>
      `🎉 ${username}님, IEUM에 오신 걸 환영합니다!`,
    greeting: (username) =>
      `안녕하세요 ${username}님 😊 IEUM과 함께하게 되어 정말 반갑습니다.`,
    experience:
      "팀에서 이런 상황, 한 번쯤 겪어보셨을 거예요.",
    quote:
      "“이번 주에 팀에서 무슨 일이 있었지?”<br />" +
      "“중요한 논의가 Slack 어디에 있었더라?”<br />" +
      "“결국 요약은 내가 해야 하네…”",
    introduction:
      "IEUM은 이런 고민에서 출발했습니다.<br />" +
      "Slack, GitHub 등 팀의 활동 데이터를 자동으로 수집하고<br />" +
      "주간 리포트, 하이라이트, 뉴스레터로 정리해드립니다.",
    description:
      "복잡한 설정은 필요하지 않습니다.<br />" +
      "한 번만 연결해 두면 이후는 시스템과 AI가 자동으로 처리합니다.<br />" +
      "팀은 일에만 집중하세요.",
    button:
      "👉 IEUM 시작하기",
    footer:
      "감사합니다.<br />– IEUM 팀 드림",
  },

  en: {
    preview: (username) =>
      `Welcome to IEUM, ${username}!`,
    heading: (username) =>
      `🎉 Welcome to IEUM, ${username}!`,
    greeting: (username) =>
      `Hello ${username} 😊 We're excited to have you with IEUM.`,
    experience:
      "You've probably experienced situations like this in your team.",
    quote:
      "“What happened in the team this week?”<br />" +
      "“Where was that important discussion in Slack?”<br />" +
      "“Do I really have to summarize everything myself?”",
    introduction:
      "IEUM was built to solve these problems.<br />" +
      "We automatically collect your team's activity data from Slack, GitHub, and more,\n" +
      "and organize it into weekly reports, highlights, and newsletters.",
    description:
      "No complex setup required.<br />" +
      "Just connect once, and our system and AI take care of the rest.<br />" +
      "Your team can stay focused on what matters.",
    button:
      "👉 Start IEUM",
    footer:
      "Thank you.<br />– The IEUM Team",
  },

  ja: {
    preview: (username) =>
      `${username}さん、IEUMへようこそ！`,
    heading: (username) =>
      `🎉 ${username}さん、IEUMへようこそ！`,
    greeting: (username) =>
      `こんにちは、${username}さん 😊 IEUMをご利用いただきありがとうございます。`,
    experience:
      "チームで、このような状況を一度は経験されたことがあるのではないでしょうか。",
    quote:
      "「今週、チームで何が起きていたのか分からない」<br />" +
      "「重要な議論がSlackのどこにあったのか思い出せない」<br />" +
      "「結局、要約は自分がやるしかない…」",
    introduction:
      "IEUMは、こうした課題を解決するために生まれました。<br />" +
      "SlackやGitHubなどのチーム活動データを自動で収集し、<br />" +
      "週次レポート、ハイライト、ニュースレターとして整理します。",
    description:
      "複雑な設定は必要ありません。<br />" +
      "一度連携すれば、あとはシステムとAIが自動で処理します。<br />" +
      "チームは業務に集中してください。",
    button:
      "👉 IEUMを始める",
    footer:
      "ありがとうございます。<br />– IEUMチームより",
  },
};


export default function WelcomeUser({ 
  username = "user", 
  locale = "ko" 
}: WelcomeUserProps) {
  const t = welcomeMessages[locale];
  
  return (
    <Html style={{ colorScheme: "light" }}>
      <Head />
      <Preview>{t.preview(username)}</Preview>
  
      <Section style={styles.wrapper}>
        <Row>
          <Column>
            <Text style={styles.heading}>
              {t.heading(username)}
            </Text>
  
            <Text style={styles.text} dangerouslySetInnerHTML={{ __html: t.greeting(username) }} />
  
            <Text style={styles.text}>
              {t.experience}
            </Text>
  
            <Text style={styles.quote} dangerouslySetInnerHTML={{ __html: t.quote }} />
  
            <Text style={styles.text} dangerouslySetInnerHTML={{ __html: t.introduction }} />
  
            <Text style={styles.text} dangerouslySetInnerHTML={{ __html: t.description }} />
  
            <Button
              href="https://nexletter.app/"
              style={styles.button}
            >
              {t.button}
            </Button>
  
            <Text style={styles.footer} dangerouslySetInnerHTML={{ __html: t.footer }} />
          </Column>
        </Row>
      </Section>
    </Html>
  );
}
  
  const styles = {
    wrapper: {
      backgroundColor: "#f8fafc", // 더 밝은 배경
      padding: "40px 24px",
      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
      borderRadius: "16px",
      boxShadow: "0 4px 24px rgba(60, 80, 180, 0.08)",
      maxWidth: "480px",
      margin: "40px auto",
      border: "1px solid #e5e7eb",
    },
    heading: {
      fontSize: "22px",
      fontWeight: "bold" as const,
      marginBottom: "24px",
      color: "#2563eb", // 포인트 컬러
      letterSpacing: "-0.5px",
      textAlign: "center" as const,
    },
    text: {
      fontSize: "15px",
      lineHeight: "1.7",
      color: "#22223b",
      marginBottom: "18px",
      textAlign: "left" as const,
    },
    quote: {
        fontSize: "15px",
        lineHeight: "1.7",
        color: "#1e293b", // text-slate-800
        fontStyle: "italic",
        backgroundColor: "#f1f5f9", // slate-100
        padding: "16px 18px",
        borderLeft: "4px solid #3b82f6",
        borderRadius: "8px",
        marginBottom: "18px",
        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.06)",
      },
    button: {
      display: "inline-block",
      padding: "14px 32px",
      background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
      color: "#fff",
      borderRadius: "8px",
      fontWeight: "bold" as const,
      fontSize: "15px",
      textDecoration: "none",
      marginTop: "28px",
      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.10)",
      border: "none",
      transition: "background 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    },
    footer: {
      fontSize: "13px",
      color: "#64748b",
      marginTop: "44px",
      textAlign: "center" as const,
      letterSpacing: "0.1px",
    },
  };
  