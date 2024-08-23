import { app as serverEn } from "./server/en/server.mjs";
import { app as serverDe } from "./server/de/server.mjs";
import { app as serverDeCH } from "./server/de-CH/server.mjs";

const express = require("express");

function run() {
  const port = process.env.PORT || 8080;
  const server = express();

  server.use("/en", serverEn());
  server.use("/de", serverDe());
  server.use("/de-CH", serverDeCH());
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
