import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { SITE_URL, routes } from "../site.config.mjs";

const requiredOg = ["og:title", "og:description", "og:type", "og:url", "og:image"];
const requiredTwitter = ["twitter:card", "twitter:title", "twitter:description", "twitter:image"];
const localUrlPattern = /(127\.0\.0\.1|localhost|pages\.dev|workers\.dev)/i;

function absoluteUrl(route) {
  return new URL(route, SITE_URL).href;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function match(html, regex) {
  return html.match(regex)?.[1]?.trim() ?? "";
}

function metaContent(html, attribute, name) {
  const regex = new RegExp(
    `<meta\\s+${attribute}="${name}"\\s+content="([^"]+)"|<meta\\s+content="([^"]+)"\\s+${attribute}="${name}"`,
    "i",
  );
  const result = html.match(regex);
  return result?.[1] ?? result?.[2] ?? "";
}

function imageAltIssues(html) {
  const issues = [];
  const images = [...html.matchAll(/<img\b[^>]*>/gi)];
  images.forEach(([tag], index) => {
    const alt = tag.match(/\salt=(["'])(.*?)\1/i)?.[2];
    if (alt === undefined) {
      issues.push(`image ${index + 1} missing alt`);
      return;
    }
    if (alt === "" && !/\saria-hidden=(["'])true\1/i.test(tag)) {
      issues.push(`decorative image ${index + 1} missing aria-hidden`);
    }
    if (/^(image|imagen|illustration|ilustración|photo|foto)$/i.test(alt.trim())) {
      issues.push(`image ${index + 1} has vague alt: ${alt}`);
    }
  });
  return issues;
}

function jsonLdTypes(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = new Set();
  for (const [, raw] of blocks) {
    const data = JSON.parse(raw);
    const stack = [data];
    while (stack.length) {
      const item = stack.pop();
      if (!item || typeof item !== "object") continue;
      if (item["@type"]) {
        if (Array.isArray(item["@type"])) {
          item["@type"].forEach((type) => types.add(type));
        } else {
          types.add(item["@type"]);
        }
      }
      Object.values(item).forEach((value) => {
        if (Array.isArray(value)) stack.push(...value);
        else if (value && typeof value === "object") stack.push(value);
      });
    }
  }
  return types;
}

const failures = [];
const report = [];
const badHeadingPattern = /(Que dicen\?|Quien Soy\?|¿Para quién esta diseñada esta experiencia\?)/;
const routeFiles = new Set(routes.map((route) => route.file));

function walkHtmlFiles(dir = ".") {
  const ignoreDirs = new Set([".git", "assets", "dist", "docs", "node_modules", "public"]);
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = dir === "." ? entry : `${dir}/${entry}`;
    if (ignoreDirs.has(entry)) continue;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...walkHtmlFiles(path));
    } else if (entry.endsWith(".html")) {
      files.push(path);
    }
  }
  return files;
}

for (const route of routes) {
  const html = readFileSync(route.file, "utf8");
  const title = match(html, /<title>([\s\S]*?)<\/title>/);
  const description = match(html, /<meta\s+name="description"\s+content="([^"]+)"/);
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const h1Text = stripTags(match(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/));
  const canonical = match(html, /<link\s+rel="canonical"\s+href="([^"]+)"/);
  const types = jsonLdTypes(html);
  const expectedUrl = absoluteUrl(route.route);
  const ogTitle = metaContent(html, "property", "og:title");
  const ogDescription = metaContent(html, "property", "og:description");
  const ogUrl = metaContent(html, "property", "og:url");
  const ogImage = metaContent(html, "property", "og:image");
  const twitterTitle = metaContent(html, "name", "twitter:title");
  const twitterDescription = metaContent(html, "name", "twitter:description");
  const twitterImage = metaContent(html, "name", "twitter:image");
  const imgAltIssues = imageAltIssues(html);
  const ogOk = requiredOg.every((name) => html.includes(`property="${name}"`));
  const twitterOk = requiredTwitter.every((name) => html.includes(`name="${name}"`));
  const schemaOk =
    route.schema.every((type) => types.has(type)) &&
    (!route.anySchema || route.anySchema.some((type) => types.has(type)));
  const internalLinksOk = (route.requiredLinks ?? []).every((href) => html.includes(`href="${href}`));

  const checks = {
    title: title === route.title && title.length > 0 && title.length <= 70,
    description: description === route.description && description.length > 0 && description.length <= 170,
    h1: h1Count === 1 && (!route.h1 || h1Text === route.h1),
    canonical: canonical === expectedUrl,
    og:
      ogOk &&
      ogTitle === route.title &&
      ogDescription === route.description &&
      ogUrl === expectedUrl &&
      ogImage === route.image,
    twitter:
      twitterOk &&
      twitterTitle === route.title &&
      twitterDescription === route.description &&
      twitterImage === route.image,
    schema: schemaOk,
    localUrls: !localUrlPattern.test(html),
    imageAlt: imgAltIssues.length === 0,
    internalLinks: internalLinksOk,
    spanishHeadings: !badHeadingPattern.test(html),
    mainLandmark: html.includes('class="skip-link" href="#contenido"') && html.includes('<main id="contenido"'),
  };

  for (const [name, passed] of Object.entries(checks)) {
    if (!passed) {
      const detail = name === "imageAlt" ? ` (${imgAltIssues.join("; ")})` : "";
      failures.push(`${route.route}: ${name} failed${detail}`);
    }
  }

  report.push({
    route: route.route,
    title: title.length,
    description: description.length,
    h1Count,
    h1Text,
    canonical: canonical === expectedUrl,
    og: checks.og,
    twitter: checks.twitter,
    schema: [...types].sort().join(", "),
    imageAltIssues: imgAltIssues.length ? imgAltIssues.join("; ") : "none",
    internalLinks: checks.internalLinks,
  });
}

for (const requiredFile of ["robots.txt", "sitemap.xml", "public/robots.txt", "public/sitemap.xml"]) {
  if (!existsSync(requiredFile)) failures.push(`${requiredFile} is missing`);
}

const robotsFiles = ["robots.txt", "public/robots.txt"].filter(existsSync);
const sitemapFiles = ["sitemap.xml", "public/sitemap.xml"].filter(existsSync);
for (const robotsPath of robotsFiles) {
  const robots = readFileSync(robotsPath, "utf8");
  if (!robots.includes("Allow: /")) failures.push(`${robotsPath} does not allow crawling`);
  if (!robots.includes(`Sitemap: ${absoluteUrl("/sitemap.xml")}`)) {
    failures.push(`${robotsPath} does not reference sitemap.xml`);
  }
}
for (const sitemapPath of sitemapFiles) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  for (const route of routes) {
    if (!sitemap.includes(absoluteUrl(route.route))) {
      failures.push(`${sitemapPath} missing ${route.route}`);
    }
  }
  if (localUrlPattern.test(sitemap)) failures.push(`${sitemapPath} contains a local or preview URL`);
}

for (const htmlFile of walkHtmlFiles()) {
  if (routeFiles.has(htmlFile)) continue;
  const html = readFileSync(htmlFile, "utf8");
  if (!/<meta\s+name="robots"\s+content="noindex,follow"\s*\/?>/i.test(html)) {
    failures.push(`${htmlFile} is outside the sitemap and missing noindex,follow`);
  }
}

console.table(report);

if (failures.length) {
  console.error("SEO validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("SEO validation passed.");
