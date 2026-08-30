import { ReactNode } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  urlPath?: string;
  children?: ReactNode;
}

export function Seo({ 
  title = "7sadakonr | Portfolio", 
  description = "Portfolio of Jetsadakorn (7sadakonr) - Full Stack Developer & UI/UX enthusiast crafting modern web experiences.",
  urlPath = "" 
}: SeoProps) {
  const fullUrl = `https://www.7sadakonr.xyz${urlPath}`;
  
  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Jetsadakorn",
    "alternateName": "7sadakonr",
    "url": "https://www.7sadakonr.xyz",
    "jobTitle": "Full Stack Developer",
    "sameAs": [
      "https://github.com/7sadakonr"
      // Add LinkedIn or other socials here
    ]
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Schema.org markup */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </>
  );
}
