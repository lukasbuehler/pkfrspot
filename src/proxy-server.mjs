const supportedLanguages = ["en", "de", "de-CH", "it"];
const defaultLanguage = "en";

const serverExpressApps = {};

for (const lang of supportedLanguages) {
  serverExpressApps[lang] = (await import(`./${lang}/server.mjs`)).app;
  console.log("Loaded server for lang:", lang);
}

const express = require("express");

function detectLanguage(req, res, next) {
  const acceptLanguage = req.headers["accept-language"];
  if (!acceptLanguage) {
    // No accept-language header!
    return next();
  }

  const browserLanguages = acceptLanguage
    .split(",")
    .map((lang) => lang.split(";")[0]);
  const uniqueLanguages = new Set();
  for (const lang of browserLanguages) {
    const baseLang = lang.split("-")[0];
    if (!uniqueLanguages.has(baseLang)) {
      uniqueLanguages.add(baseLang);
    }
    uniqueLanguages.add(lang);
  }
  const languages = Array.from(uniqueLanguages);

  //   console.log("languages", languages);

  const preferredLanguage =
    languages.find((lang) => supportedLanguages.includes(lang)) ||
    defaultLanguage;

  return res.redirect(301, `/${preferredLanguage}${req.path}`);

  next();
}

function run() {
  const port = process.env.PORT || 8080;
  const server = express();

  for (const lang of supportedLanguages) {
    server.use(`/${lang}`, serverExpressApps[lang]());
  }

  // Redirect based on preffered language
  server.use(detectLanguage);

  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
