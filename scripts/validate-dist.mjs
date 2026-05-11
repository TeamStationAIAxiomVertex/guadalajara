import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL, routes } from "../site.config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const REQUIRED_DIST_FILES = ["index.html", "robots.txt", "sitemap.xml", "_headers", "_redirects"];
const FORBIDDEN_URL_PATTERN =
  /(localhost|127\.0\.0\.1|pages\.dev|workers\.dev|vercel\.app|netlify\.app|github\.io|preview|staging)/i;
const requiredOg = ["og:title", "og:description", "og:type", "og:url", "og:image"];
const requiredTwitter = ["twitter:card", "twitter:title", "twitter:description", "twitter:image"];

const failures = [];

function distPath(...parts) {
  return path.join(DIST, ...parts);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function routeUrl(route) {
  return new URL(route, SITE_URL).href;
}

function routeDistFile(route) {
  if (route.file === "index.html") return distPath("index.html");
  return distPath(route.file);
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

function walkFiles(dir = DIST) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) files.push(...walkFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function isTextFile(file) {
  return [".html", ".css", ".js", ".json", ".txt", ".xml", ".svg", ""].includes(path.extname(file).toLowerCase());
}

function parseJsonLd(html, route) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const parsed = [];
  for (const [, raw] of blocks) {
    try {
      parsed.push(JSON.parse(raw));
    } catch (error) {
      failures.push(`${route}: invalid JSON-LD (${error.message})`);
    }
  }
  return parsed;
}

function collectSchemaTypes(items) {
  const types = new Set();
  const stack = [...items];
  while (stack.length) {
    const item = stack.pop();
    if (!item || typeof item !== "object") continue;
    if (item["@type"]) {
      if (Array.isArray(item["@type"])) item["@type"].forEach((type) => types.add(type));
      else types.add(item["@type"]);
    }
    Object.values(item).forEach((value) => {
      if (Array.isArray(value)) stack.push(...value);
      else if (value && typeof value === "object") stack.push(value);
    });
  }
  return types;
}

function validateSchemaUrls(items, route) {
  const watchedKeys = new Set(["url", "image", "logo", "@id", "item"]);
  const stack = [...items];
  while (stack.length) {
    const item = stack.pop();
    if (!item || typeof item !== "object") continue;
    for (const [key, value] of Object.entries(item)) {
      const values = Array.isArray(value) ? value : [value];
      if (watchedKeys.has(key)) {
        values
          .filter((candidate) => typeof candidate === "string")
          .forEach((candidate) => {
            if (FORBIDDEN_URL_PATTERN.test(candidate)) {
              failures.push(`${route}: JSON-LD ${key} contains forbidden URL: ${candidate}`);
            }
            if (/^https?:\/\//i.test(candidate) && ["image", "logo"].includes(key) && !candidate.startsWith(SITE_URL)) {
              failures.push(`${route}: JSON-LD ${key} must use ${SITE_URL}: ${candidate}`);
            }
          });
      }
      values.forEach((candidate) => {
        if (Array.isArray(candidate)) stack.push(...candidate);
        else if (candidate && typeof candidate === "object") stack.push(candidate);
      });
    }
  }
}

function imageAltIssues(html) {
  const issues = [];
  [...html.matchAll(/<img\b[^>]*>/gi)].forEach(([tag], index) => {
    const alt = tag.match(/\salt=(["'])(.*?)\1/i)?.[2];
    if (alt === undefined) {
      issues.push(`image ${index + 1} missing alt`);
      return;
    }
    if (alt === "" && !/\saria-hidden=(["'])true\1/i.test(tag)) {
      issues.push(`decorative image ${index + 1} missing aria-hidden`);
    }
    if (/^(image|imagen|illustration|ilustración|photo|foto|hero|banner)$/i.test(alt.trim())) {
      issues.push(`image ${index + 1} has vague alt: ${alt}`);
    }
  });
  return issues;
}

function cleanUrl(value) {
  return value.trim().replace(/&amp;/g, "&").split("#")[0].split("?")[0];
}

function isExternalUrl(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith(SITE_URL);
}

function referenceToDistPath(reference, fromFile) {
  const cleaned = cleanUrl(reference);
  if (!cleaned || cleaned.startsWith("#")) return null;
  if (/^(data:|mailto:|tel:|sms:|javascript:)/i.test(cleaned)) return null;
  if (isExternalUrl(cleaned)) return null;

  let pathname = cleaned;
  if (cleaned.startsWith(SITE_URL)) pathname = new URL(cleaned).pathname;

  if (pathname.startsWith("/")) {
    if (pathname === "/") return distPath("index.html");
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    const candidate = distPath(relative);
    return pathname.endsWith("/") ? path.join(candidate, "index.html") : candidate;
  }

  return path.resolve(path.dirname(fromFile), pathname);
}

function expandSrcset(value) {
  return value
    .split(",")
    .map((item) => item.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function htmlReferences(html) {
  const references = [];
  const attributePattern = /\b(src|href|srcset|imagesrcset)=["']([^"']+)["']/gi;
  for (const [, name, value] of html.matchAll(attributePattern)) {
    if (name.toLowerCase().includes("srcset")) references.push(...expandSrcset(value));
    else references.push(value);
  }
  return references;
}

function cssReferences(css) {
  return [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map(([, value]) => value);
}

function validateReferences(files, getReferences) {
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const reference of getReferences(content)) {
      const target = referenceToDistPath(reference, file);
      if (!target) continue;
      if (!target.startsWith(DIST)) {
        failures.push(`${toPosix(path.relative(DIST, file))}: internal reference points outside dist: ${reference}`);
        continue;
      }
      if (!existsSync(target)) {
        failures.push(`${toPosix(path.relative(DIST, file))}: missing internal reference ${reference}`);
      }
    }
  }
}

function distFileForUrl(url) {
  const { pathname } = new URL(url);
  if (pathname === "/") return distPath("index.html");
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const candidate = distPath(relative);
  return pathname.endsWith("/") ? path.join(candidate, "index.html") : candidate;
}

if (!existsSync(DIST)) failures.push("dist does not exist.");
if (existsSync(DIST)) {
  for (const file of REQUIRED_DIST_FILES) {
    if (!existsSync(distPath(file))) failures.push(`dist/${file} is missing.`);
  }
  if (!existsSync(distPath("assets")) || !statSync(distPath("assets")).isDirectory()) {
    failures.push("dist/assets is missing.");
  }
}

if (!failures.length) {
  const allFiles = walkFiles();
  for (const file of allFiles.filter(isTextFile)) {
    const content = readFileSync(file, "utf8");
    if (FORBIDDEN_URL_PATTERN.test(content)) {
      failures.push(`${toPosix(path.relative(DIST, file))} contains local, preview, staging, or temporary URL text.`);
    }
  }

  const robots = readFileSync(distPath("robots.txt"), "utf8");
  for (const requiredLine of ["User-agent: *", "Allow: /", `Sitemap: ${SITE_URL}/sitemap.xml`]) {
    if (!robots.includes(requiredLine)) failures.push(`robots.txt missing required line: ${requiredLine}`);
  }

  const sitemap = readFileSync(distPath("sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
  const configuredUrls = routes.map((route) => routeUrl(route.route));
  for (const sitemapUrl of sitemapUrls) {
    if (!sitemapUrl.startsWith(SITE_URL)) failures.push(`sitemap.xml URL does not start with ${SITE_URL}: ${sitemapUrl}`);
    if (!configuredUrls.includes(sitemapUrl)) failures.push(`sitemap.xml contains unconfigured URL: ${sitemapUrl}`);
  }
  for (const configuredUrl of configuredUrls) {
    if (!sitemapUrls.includes(configuredUrl)) failures.push(`sitemap.xml missing configured route: ${configuredUrl}`);
  }

  const configuredRouteFiles = new Set(routes.map((route) => path.resolve(routeDistFile(route))));
  for (const route of routes) {
    const file = routeDistFile(route);
    const html = existsSync(file) ? readFileSync(file, "utf8") : "";
    const expectedUrl = routeUrl(route.route);

    if (!existsSync(file)) {
      failures.push(`${route.route}: route file missing in dist (${toPosix(path.relative(DIST, file))})`);
      continue;
    }

    const title = match(html, /<title>([\s\S]*?)<\/title>/);
    const description = match(html, /<meta\s+name="description"\s+content="([^"]+)"/);
    const h1Count = (html.match(/<h1\b/gi) ?? []).length;
    const canonical = match(html, /<link\s+rel="canonical"\s+href="([^"]+)"/);
    const metaRobots = metaContent(html, "name", "robots");
    const ogTitle = metaContent(html, "property", "og:title");
    const ogDescription = metaContent(html, "property", "og:description");
    const ogUrl = metaContent(html, "property", "og:url");
    const ogImage = metaContent(html, "property", "og:image");
    const twitterTitle = metaContent(html, "name", "twitter:title");
    const twitterDescription = metaContent(html, "name", "twitter:description");
    const twitterImage = metaContent(html, "name", "twitter:image");
    const jsonLd = parseJsonLd(html, route.route);
    const schemaTypes = collectSchemaTypes(jsonLd);
    const altIssues = imageAltIssues(html);

    if (!title) failures.push(`${route.route}: missing title.`);
    if (!description) failures.push(`${route.route}: missing meta description.`);
    if (h1Count !== 1) failures.push(`${route.route}: expected exactly one h1, found ${h1Count}.`);
    if (!canonical) failures.push(`${route.route}: missing canonical.`);
    if (canonical && !canonical.startsWith(SITE_URL)) failures.push(`${route.route}: canonical does not start with ${SITE_URL}.`);
    if (canonical && canonical !== expectedUrl) failures.push(`${route.route}: canonical mismatch, expected ${expectedUrl}.`);
    if (metaRobots && /noindex/i.test(metaRobots)) failures.push(`${route.route}: configured production route is noindex.`);
    if (!requiredOg.every((name) => html.includes(`property="${name}"`))) failures.push(`${route.route}: missing Open Graph metadata.`);
    if (!requiredTwitter.every((name) => html.includes(`name="${name}"`))) failures.push(`${route.route}: missing Twitter card metadata.`);
    if (ogUrl !== expectedUrl) failures.push(`${route.route}: og:url must equal canonical route URL.`);
    if (ogUrl && !ogUrl.startsWith(SITE_URL)) failures.push(`${route.route}: og:url does not start with ${SITE_URL}.`);
    if (ogImage && !ogImage.startsWith(SITE_URL)) failures.push(`${route.route}: og:image does not start with ${SITE_URL}.`);
    if (twitterImage && !twitterImage.startsWith(SITE_URL)) failures.push(`${route.route}: twitter:image does not start with ${SITE_URL}.`);
    if (canonical && ogUrl && canonical !== ogUrl) failures.push(`${route.route}: canonical and og:url must be identical.`);
    if (title && twitterTitle && title !== twitterTitle) failures.push(`${route.route}: title and twitter:title are not aligned.`);
    if (description && ogDescription && description !== ogDescription) {
      failures.push(`${route.route}: meta description and og:description are not aligned.`);
    }
    if (ogDescription && twitterDescription && ogDescription !== twitterDescription) {
      failures.push(`${route.route}: og:description and twitter:description are not aligned.`);
    }
    if (!jsonLd.length) failures.push(`${route.route}: missing JSON-LD.`);
    if (jsonLd.length) validateSchemaUrls(jsonLd, route.route);
    if (route.schema && !route.schema.every((type) => schemaTypes.has(type))) {
      failures.push(`${route.route}: schema missing required type. Found: ${[...schemaTypes].sort().join(", ")}`);
    }
    if (route.anySchema && !route.anySchema.some((type) => schemaTypes.has(type))) {
      failures.push(`${route.route}: schema missing one of ${route.anySchema.join(", ")}.`);
    }
    if (altIssues.length) failures.push(`${route.route}: image alt issues: ${altIssues.join("; ")}`);
    if (ogImage && ogImage.startsWith(SITE_URL) && !existsSync(distFileForUrl(ogImage))) {
      failures.push(`${route.route}: og:image file missing in dist: ${ogImage}`);
    }
    if (twitterImage && twitterImage.startsWith(SITE_URL) && !existsSync(distFileForUrl(twitterImage))) {
      failures.push(`${route.route}: twitter:image file missing in dist: ${twitterImage}`);
    }
  }

  const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));
  for (const htmlFile of htmlFiles) {
    if (configuredRouteFiles.has(path.resolve(htmlFile))) continue;
    const html = readFileSync(htmlFile, "utf8");
    if (!/<meta\s+name="robots"\s+content="noindex,follow"\s*\/?>/i.test(html)) {
      failures.push(`${toPosix(path.relative(DIST, htmlFile))}: public HTML outside sitemap lacks noindex,follow.`);
    }
  }

  validateReferences(htmlFiles, htmlReferences);
  validateReferences(allFiles.filter((file) => file.endsWith(".css")), cssReferences);
}

if (failures.length) {
  console.error("Dist validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Dist validation passed.");
