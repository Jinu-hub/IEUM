/**
 * Newsletter System Footer Component
 *
 * A comprehensive footer for the NexLetter internal newsletter system.
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
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GitHubIcon, NexFooter, SlackIcon } from "~/core/components/nex";
import { Actions } from "./navigation-bar";

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
  const { t, i18n } = useTranslation();

  // Handle newsletter subscription
  const handleNewsletterSubscribe = async (email: string) => {
    // In a real application, this would make an API call
    console.log("Newsletter subscription for:", email);
    // You could integrate with your email service here
  };

  // Company information - language dependent
  const companyInfo = i18n.language === "ko"
    ? [
        "링크버스(LinkVerse) | 사업자번호 844-64-00886 | 통신판매업 제2026-부산수영-0064호 | 대표: 송진우",
        "부산 수영구 남천바다로21번길 69-5 | 문의: jinu30dev@gmail.com (010-6454-8896)"
      ]
    : undefined;

  // Build legal links - Commercial Disclosure only for non-Korean languages
  const legalItems = [
    { label: t("footer.links.legal.items.privacyPolicy"), href: "/legal/privacy-policy" },
    { label: t("footer.links.legal.items.termsOfService"), href: "/legal/terms-of-service" },
  ];

  // Add Commercial Disclosure link for non-Korean languages
  if (i18n.language == "ko") {
    legalItems.push({
      label: t("pricing.faq.refundPolicyLink"),
      href: "/legal/refund-policy"
    });
  } else {
    const commercialDisclosureLabel = i18n.language === "ja" 
      ? "特定商取引法に基づく表記" 
      : "Commercial Disclosure";
    legalItems.push({
      label: commercialDisclosureLabel,
      href: "/legal/commercial-disclosure"
    });
  }

  // Footer navigation links organized by sections
  const footerLinks = [
    {
      title: t("footer.links.product.title"),
      items: [
        { label: t("footer.links.product.items.samples"), href: "/samples" },
        { label: t("footer.links.product.items.pricing"), href: "/pricing" },
        { label: t("footer.links.product.items.sitemap"), href: "/site-map", disabled: true, tooltip: t("footer.links.product.items.sitemapTooltip") },
      ]
    },
    {
      title: t("footer.links.info.title"),
      items: [
        { label: t("footer.links.info.items.about"), href: "/about" },
        { label: t("footer.links.info.items.blog"), href: "/blog", disabled: true, tooltip: t("footer.links.product.items.sitemapTooltip") },
        //{ label: "채용", href: "/careers" },
        //{ label: "연락처", href: "/contact" },
        //{ label: "뉴스", href: "/news" }
      ]
    },
    {
      title: t("footer.links.support.title"),
      items: [
        { label: t("footer.links.support.items.faq"), href: "/faq" },
        { label: t("footer.links.support.items.contact"), href: "/contact" },
        { label: t("footer.links.support.items.community"), href: "/forum", disabled: true, tooltip: t("footer.links.support.items.communityTooltip") },
      ]
    },
    {
      title: t("footer.links.legal.title"),
      items: legalItems
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
      href: "mailto:jinu30dev@gmail.com",
      label: "Email",
      icon: <Mail className="h-5 w-5" />
    },
    /*
    {
      platform: "custom" as const,
      href: "/feedback",
      label: "피드백",
      icon: <MessageSquare className="h-5 w-5" />
    }
    */
  ];

  return (
    <NexFooter
      variant="default"
      brand={{
        name: "NexLetter",
        description: t("footer.brand.description"),
        logo: <Mail className="h-8 w-8" />
      }}
      links={footerLinks}
      social={socialLinks}
      legal={{
        copyright: "© 2026 LinkVerse. All rights reserved.\nNexLetter is a service operated by LinkVerse.",
        companyInfo: companyInfo,
      }}
      actions={<Actions />}
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
