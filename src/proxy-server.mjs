import path from "node:path";
import express from "express";

const supportedLanguages = ["en", "de", "de-CH", "it"];
const defaultLanguage = "en";
const langSupportedPaths = ["map", "about"];

const serverExpressApps = {};

for (const lang of supportedLanguages) {
  serverExpressApps[lang] = (await import(`./${lang}/server.mjs`)).app;
  console.log("Loaded server for lang:", lang);
}

function detectLanguage(req, res, next) {
  let preferredLanguage = defaultLanguage;

  const acceptLanguage = req.headers["accept-language"];

  if (acceptLanguage) {
    const browserLanguages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0]);
    const uniqueLanguages = new Set();

    for (const lang of browserLanguages) {
      const baseLang = lang.split("-")[0];
      if (!uniqueLanguages.has(lang)) {
        uniqueLanguages.add(lang); // Add full language code
      }
      if (!uniqueLanguages.has(baseLang)) {
        uniqueLanguages.add(baseLang); // Add base language
      }
    }

    const languages = Array.from(uniqueLanguages);

    preferredLanguage =
      languages.find((lang) => supportedLanguages.includes(lang)) ||
      defaultLanguage;
  }

  // Extract the first segment of the path (e.g., "en" from "/en/map")
  const pathSegments = req.path.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];

  // If the first segment is a valid language code, pass control to the next middleware
  if (supportedLanguages.includes(firstSegment)) {
    return next();
  }

  // Extract the first segment of the path for redirection handling
  const requestPath = pathSegments[0];

  if (langSupportedPaths.includes(requestPath)) {
    return res.redirect(301, `/${preferredLanguage}/${requestPath}`);
  } else {
    // For other cases, redirect to the root of the detected language
    return res.redirect(301, `/${preferredLanguage}/`);
  }
}

function run() {
  const port = process.env.PORT || 8080;
  const server = express();

  server.get("/robots.txt", (req, res) => {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    res.sendFile(path.join(__dirname, "../browser/en/robots.txt"));
  });

  // Redirect based on preffered language
  server.get("*", detectLanguage);

  // Mount language specific angular SSR server apps
  for (const lang of supportedLanguages) {
    server.use(`/${lang}`, serverExpressApps[lang]());
  }

  // Catch-all route for unmatched requests
  server.use((req, res) => {
    res.status(404).send("Not Found");
  });

  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
