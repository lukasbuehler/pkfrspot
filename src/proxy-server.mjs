import { app as serverEn } from "./server/en/server.mjs";
import { app as serverDe } from "./server/de/server.mjs";
import { app as serverDeCH } from "./server/de-CH/server.mjs";

const express = require("express");

function detectLanguage(req, res, next) {
  const acceptLanguage = req.headers["accept-language"];
  if (!acceptLanguage) {
    return next();
  }

  const languages = acceptLanguage.split(",").map((lang) => lang.split(";")[0]);
  const supportedLanguages = ["en", "de", "de-CH"];
  const defaultLanguage = "en";

  const preferredLanguage =
    languages.find((lang) => supportedLanguages.includes(lang)) ||
    defaultLanguage;

  if (
    !req.path.startsWith("/en") &&
    !req.path.startsWith("/de") &&
    !req.path.startsWith("/de-CH")
  ) {
    return res.redirect(`/${preferredLanguage}${req.path}`);
  }

  next();
}

function run() {
  const port = process.env.PORT || 8080;
  const server = express();

  server.use(detectLanguage);

  server.use("/en", serverEn());
  server.use("/de", serverDe());
  server.use("/de-CH", serverDeCH());
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
