/**
 * SEO component — per-route head tags via react-helmet-async.
 * Sets unique title, description, canonical, og:* and optional JSON-LD.
 * The static index.html still ships sitewide fallbacks for crawlers that
 * don't execute JS (LinkedIn, Slack, Facebook).
 */
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE = "https://planik.org.uk";

interface SEOProps {
  title: string;
  description: string;
  /** Optional override; defaults to current pathname. */
  path?: string;
  /** Optional JSON-LD payload (or array of payloads). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Optional Open Graph type; defaults to "website". */
  ogType?: "website" | "article";
}

export function SEO({ title, description, path, jsonLd, ogType = "website" }: SEOProps) {
  const location = useLocation();
  const url = `${SITE}${path ?? location.pathname}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
}

export default SEO;
