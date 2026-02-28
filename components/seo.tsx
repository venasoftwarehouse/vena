import { Activity } from "lucide-react";
import Head from "next/head";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  favicon?: string;
  appleTouchIcon?: string;
  icon32?: string;
  icon16?: string;
  manifest?: string;
  themeColor?: string;
  additionalMetaTags?: Array<{
    name: string;
    content: string;
  }>;
}

export function SEO({
  title = "Vena - Monitor Glukosa Darah dengan Teknologi Patch Pintar",
  description = "Aplikasi monitoring glukosa darah dengan teknologi patch pintar yang inovatif. Pantau kadar gula darah Anda dengan mudah dan akurat.",
  keywords = "glukosa darah, diabetes, monitoring kesehatan, patch pintar, Vena, kesehatan",
  ogTitle,
  ogDescription,
  ogImage = "/images/og-image.jpg",
  ogUrl,
  twitterCard = "summary_large_image",
  twitterTitle,
  twitterDescription,
  twitterImage = "/images/twitter-image.jpg",
  favicon = "/favicon.svg",
  appleTouchIcon = "/apple-touch-icon.svg",
  icon32 = "/favicon-32x32.svg",
  icon16 = "/favicon-16x16.svg",
  manifest = "/site.webmanifest",
  themeColor = "#0f172a",
  additionalMetaTags = [],
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vena.vercel.app";
  const finalOgUrl = ogUrl || siteUrl;
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const finalTwitterTitle = twitterTitle || title;
  const finalTwitterDescription = twitterDescription || description;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Vena Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={finalOgUrl} />
      <meta property="og:site_name" content="Vena" />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalTwitterTitle} />
      <meta name="twitter:description" content={finalTwitterDescription} />
      <meta name="twitter:image" content={twitterImage} />
      <meta name="twitter:creator" content="@vena" />

      {/* Icons */}
      <link rel="icon" type="image/svg+xml" href={favicon} />
      <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon} />
      <link rel="icon" type="image/svg+xml" sizes="32x32" href={icon32} />
      <link rel="icon" type="image/svg+xml" sizes="16x16" href={icon16} />
      <link rel="manifest" href={manifest} />

      {/* Fallback for browsers that don't support SVG icons */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Theme Color */}
      <meta name="theme-color" content={themeColor} />
      <meta name="msapplication-TileColor" content={themeColor} />

      {/* Additional Meta Tags */}
      {additionalMetaTags.map((tag, index) => (
        <meta key={index} name={tag.name} content={tag.content} />
      ))}

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <link rel="canonical" href={finalOgUrl} />

      {/* Additional security headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
    </Head>
  );
}