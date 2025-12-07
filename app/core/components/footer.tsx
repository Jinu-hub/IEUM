/**
 * Newsletter System Footer Component
 *
 * A comprehensive footer for the Nexletter internal newsletter system.
 * This component provides navigation links, company information, social links,
 * and newsletter subscription functionality.
 *
 * Features:
 * - Modern Nex Design System footer
 * - Newsletter subscription form
 * - Social media links
 * - Comprehensive navigation
 * - Company branding and information
 * - Legal compliance links
 */
import {
  Mail,
  MessageSquare,
} from "lucide-react";
import { GitHubIcon, NexFooter, SlackIcon } from "~/core/components/nex";

/**
 * Newsletter System Footer Component
 * 
 * A comprehensive footer using Nex Design System that provides:
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
        { label: "샘플", href: "/samples" },
        { label: "가격", href: "/pricing" },
        { label: "사이트맵", href: "/site-map", disabled: true, tooltip: "추후지원예정" },
      ]
    },
    {
      title: "정보",
      items: [
        { label: "소개", href: "/about" },
        { label: "블로그", href: "/blog" },
        //{ label: "채용", href: "/careers" },
        //{ label: "연락처", href: "/contact" },
        //{ label: "뉴스", href: "/news" }
      ]
    },
    {
      title: "서포트",
      items: [
        { label: "FAQ", href: "/faq" },
        { label: "문의하기", href: "/contact" },
        { label: "커뮤니티", href: "/forum", disabled: true, tooltip: "추후지원예정" },
      ]
    },
    {
      title: "법적 고지",
      items: [
        { label: "개인정보처리방침", href: "/legal/privacy-policy" },
        { label: "이용약관", href: "/legal/terms-of-service" },
        { label: "보안백서", href: "/legal/security-whitepaper" },
        //{ label: "쿠키 정책", href: "/legal/cookies" }
      ]
    }
  ];

  // Social and communication links
  const socialLinks = [
    {
      platform: "github" as const,
      href: "https://github.com/Jinu-hub",
      label: "GitHub",
      icon: <GitHubIcon className="h-5 w-5" />
    },
    {
      platform: "custom" as const,
      href: "https://company.slack.com",
      label: "Slack",
      icon: <SlackIcon className="h-5 w-5" />
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
    <NexFooter
      variant="default"
      brand={{
        name: "Nexletter",
        description: "팀 작업을 위한 스마트한 뉴스레터 시스템. Slack채널, GitHub레포지토리를 통합하여 팀의 주간 활동을 자동으로 정리하고 공유합니다.",
        logo: <Mail className="h-8 w-8" />
      }}
      links={footerLinks}
      social={socialLinks}
      /*
      newsletter={{
        title: "뉴스레터 구독",
        description: "매주 팀의 활동과 성과를 담은 뉴스레터를 받아보세요",
        placeholder: "이메일 주소를 입력하세요",
        buttonText: "구독하기",
        onSubmit: handleNewsletterSubscribe
      }}
        */
    />
  );
}
