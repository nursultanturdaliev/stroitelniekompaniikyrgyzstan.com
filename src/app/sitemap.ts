import type { MetadataRoute } from "next";
import { companies } from "@/data/companies";
import { constructionTypes } from "@/data/constructionTypes";
import { getElitkaProjectStaticParams } from "@/data/elitkaProjectsFromMerge";

const base = "https://stroitelniekompaniikyrgyzstan.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/projects/",
    "/projects/compare/",
    "/verify/",
    "/companies/",
    "/agencies/",
    "/remont/",
    "/types/",
    "/negotiator/",
    "/guide/",
    "/pricing/",
    "/faq/",
    "/about/",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const companyRoutes: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${base}/companies/${c.slug}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const typeRoutes: MetadataRoute.Sitemap = constructionTypes.map((t) => ({
    url: `${base}/types/${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  const projectRoutes: MetadataRoute.Sitemap = getElitkaProjectStaticParams().map((p) => ({
    url: `${base}/projects/${p.projectId}/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }));

  return [...staticRoutes, ...companyRoutes, ...typeRoutes, ...projectRoutes];
}
