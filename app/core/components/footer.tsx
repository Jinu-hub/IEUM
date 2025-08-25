/**
 * Newsletter System Footer Component
 *
 * A comprehensive footer for the Nexletter internal newsletter system.
 * This component provides navigation links, company information, social links,
 * and newsletter subscription functionality.
 *
 * Features:
 * - Modern Linear Design System footer
 * - Newsletter subscription form
 * - Social media links
 * - Comprehensive navigation
 * - Company branding and information
 * - Legal compliance links
 */
import { Link } from "react-router";
import { 
  Github, 
  Slack, 
  Mail, 
  MessageSquare,
} from "lucide-react";
import { LinearFooter } from "~/core/components/linear";

/**
 * Newsletter System Footer Component
 * 
 * A comprehensive footer using Linear Design System that provides:
 * - Company branding and information
 * - Navigation links for all major sections
 * - Social media and communication links
 * - Newsletter subscription functionality
 * - Legal compliance links
 * 
 * @returns A modern, comprehensive footer component
 */
export default function Footer() {
  // Handle newsletter subscription
  const handleNewsletterSubscribe = async (email: string) => {
    // In a real application, this would make an API call
    console.log("Newsletter subscription for:", email);
    // You could integrate with your email service here
  };

  // Footer navigation links organized by sections
  const footerLinks = [
    {
      title: "제품",
      items: [
        { label: "홈", href: "/" },
        { label: "기능", href: "/features" },
        { label: "통합", href: "/integrations" },
        { label: "가격", href: "/pricing" },
        { label: "샘플", href: "/samples" }
      ]
    },
    {
      title: "회사",
      items: [
        { label: "소개", href: "/about" },
        { label: "블로그", href: "/blog" },
        { label: "채용", href: "/careers" },
        { label: "연락처", href: "/contact" },
        { label: "뉴스", href: "/news" }
      ]
    },
    {
      title: "지원",
      items: [
        { label: "도움말", href: "/help" },
        { label: "API 문서", href: "/docs" },
        { label: "상태", href: "/status" },
        { label: "커뮤니티", href: "/community" },
        { label: "피드백", href: "/feedback" }
      ]
    },
    {
      title: "법적 고지",
      items: [
        { label: "개인정보처리방침", href: "/legal/privacy-policy" },
        { label: "이용약관", href: "/legal/terms-of-service" },
        { label: "보안", href: "/legal/security" },
        { label: "쿠키 정책", href: "/legal/cookies" }
      ]
    }
  ];

  // Social and communication links
  const socialLinks = [
    {
      platform: "github" as const,
      href: "https://github.com/company",
      label: "GitHub",
      icon: <Github className="h-5 w-5" />
    },
    {
      platform: "custom" as const,
      href: "https://company.slack.com",
      label: "Slack",
      icon: <Slack className="h-5 w-5" />
    },
    {
      platform: "email" as const,
      href: "mailto:support@company.com",
      label: "이메일",
      icon: <Mail className="h-5 w-5" />
    },
    {
      platform: "custom" as const,
      href: "/feedback",
      label: "피드백",
      icon: <MessageSquare className="h-5 w-5" />
    }
  ];

  return (
    <LinearFooter
      variant="default"
      brand={{
        name: "Nexletter",
        description: "개발팀을 위한 스마트한 뉴스레터 시스템. Slack과 GitHub을 통합하여 팀의 주간 활동을 자동으로 정리하고 공유합니다.",
        logo: <Mail className="h-8 w-8" />
      }}
      links={footerLinks}
      social={socialLinks}
      newsletter={{
        title: "개발팀 뉴스레터 구독",
        description: "매주 팀의 활동과 성과를 담은 뉴스레터를 받아보세요",
        placeholder: "이메일 주소를 입력하세요",
        buttonText: "구독하기",
        onSubmit: handleNewsletterSubscribe
      }}
    />
  );
}
