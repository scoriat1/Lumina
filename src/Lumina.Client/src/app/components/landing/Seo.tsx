import { Helmet } from 'react-helmet-async';

const siteName = 'Lumina';
const siteUrl = 'https://lumina.app';
const defaultImage = `${siteUrl}/og-image.svg`;

interface SeoProps {
  title: string;
  description: string;
  path?: string;
}

export function Seo({ title, description, path = '/' }: SeoProps) {
  const canonical = `${siteUrl}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={defaultImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultImage} />
    </Helmet>
  );
}
