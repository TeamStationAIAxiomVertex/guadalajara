import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL, routes } from "../site.config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const REQUIRED_ROOT_FILES = ["index.html", "styles.css", "script.js", "robots.txt", "sitemap.xml"];
const OPTIONAL_ROOT_FILES = ["_headers", "_redirects"];
const REQUIRED_DIRS = ["assets"];
const SOURCE_ONLY_ASSET_EXTENSIONS = new Set([".html"]);

function rootPath(...parts) {
  return path.join(ROOT, ...parts);
}

function distPath(...parts) {
  return path.join(DIST, ...parts);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function assertFile(relativePath) {
  const fullPath = rootPath(relativePath);
  if (!existsSync(fullPath)) throw new Error(`Missing required source file: ${relativePath}`);
  const stats = await stat(fullPath);
  if (!stats.isFile()) throw new Error(`Required source path is not a file: ${relativePath}`);
}

async function assertDirectory(relativePath) {
  const fullPath = rootPath(relativePath);
  if (!existsSync(fullPath)) throw new Error(`Missing required source directory: ${relativePath}`);
  const stats = await stat(fullPath);
  if (!stats.isDirectory()) throw new Error(`Required source path is not a directory: ${relativePath}`);
}

async function copyFile(relativePath) {
  await mkdir(path.dirname(distPath(relativePath)), { recursive: true });
  await cp(rootPath(relativePath), distPath(relativePath));
}

async function copyDirectory(relativePath) {
  await mkdir(distPath(relativePath), { recursive: true });
  await cp(rootPath(relativePath), distPath(relativePath), {
    recursive: true,
    filter(source) {
      const relativeSource = path.relative(rootPath(relativePath), source);
      if (!relativeSource) return true;
      return !SOURCE_ONLY_ASSET_EXTENSIONS.has(path.extname(source).toLowerCase());
    },
  });
}

function isExternalUrl(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith(SITE_URL);
}

function cleanUrl(value) {
  return value.trim().replace(/&amp;/g, "&").split("#")[0].split("?")[0];
}

function referenceToDistPath(reference, fromFile) {
  const cleaned = cleanUrl(reference);
  if (!cleaned || cleaned.startsWith("#")) return null;
  if (/^(data:|mailto:|tel:|sms:|javascript:)/i.test(cleaned)) return null;
  if (isExternalUrl(cleaned)) return null;

  let pathname = cleaned;
  if (cleaned.startsWith(SITE_URL)) {
    pathname = new URL(cleaned).pathname;
  }

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

async function walkFiles(directory, predicate = () => true) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(fullPath, predicate)));
    else if (predicate(fullPath)) files.push(fullPath);
  }
  return files;
}

async function assertReferencesExist(files, getReferences) {
  const failures = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const reference of getReferences(content)) {
      const target = referenceToDistPath(reference, file);
      if (!target) continue;
      if (!target.startsWith(DIST)) {
        failures.push(`${toPosix(path.relative(DIST, file))} references path outside dist: ${reference}`);
        continue;
      }
      if (!existsSync(target)) {
        failures.push(`${toPosix(path.relative(DIST, file))} references missing file: ${reference}`);
      }
    }
  }
  if (failures.length) {
    throw new Error(`Missing local assets or routes:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  }
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const route of routes) {
  await assertFile(route.file);
}

for (const file of REQUIRED_ROOT_FILES) {
  await assertFile(file);
  await copyFile(file);
}

for (const file of OPTIONAL_ROOT_FILES) {
  if (existsSync(rootPath(file))) await copyFile(file);
}

for (const directory of REQUIRED_DIRS) {
  await assertDirectory(directory);
  await copyDirectory(directory);
}

for (const route of routes) {
  if (route.file === "index.html") continue;
  await copyFile(route.file);
}

const distEntries = await readdir(DIST);
if (distEntries.length === 0) throw new Error("dist output is empty.");
if (!existsSync(distPath("index.html"))) throw new Error("dist/index.html was not created.");

const htmlFiles = await walkFiles(DIST, (file) => file.endsWith(".html"));
const cssFiles = await walkFiles(DIST, (file) => file.endsWith(".css"));
await assertReferencesExist(htmlFiles, htmlReferences);
await assertReferencesExist(cssFiles, cssReferences);

console.log(`Static build complete. Created ${toPosix(path.relative(ROOT, DIST))} with ${distEntries.length} top-level entries.`);
