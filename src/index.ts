import ConsoleStamp from "console-stamp";
import dotenv from "dotenv";
dotenv.config();
import { STATUS_CODES } from "http";

import compression from "compression";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import morgan from "morgan"; // console log every request

import AuthRouter from "./modules/auth/router";
import CrowdinRouter from "./modules/crowdin/router";
import DiscordRouter from "./modules/discord/router";
import DockerRouter from "./modules/docker/router";
import RssRouter from "./modules/rss/router";
import { formatDate } from "./utils/date_formatter";
import { checkEnvironmentVariables } from "./utils/env_checks";

const app = express();

if (!checkEnvironmentVariables()) {
  process.exit(1);
}

if (process.env.PROXY_LEVEL && Number(process.env.PROXY_LEVEL) > 0) {
  app.set("trust proxy", Number(process.env.PROXY_LEVEL));
}

const port = Number(process.env.PORT) || 3000;

// custom console log format
ConsoleStamp(console, {
  format: ":date(dd/mm/yyyy HH:MM:ss).blueBright :label(7)",
  extend: {
    debug: 5,
    fatal: 0,
  },
  include: ["debug", "info", "log", "warn", "error", "fatal"],
  level: "debug",
});

// Set up CORS
app.use(
  cors({
    origin: process.env.CORS_ACCEPTED_DOMAINS.split(","),
  }),
);

// Remove x-powered-by header
app.disable("x-powered-by");

// compress all responses
app.use(compression());

// set-up global rate limit
const globalLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  limit: 15, // Limit each IP to 15 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
});
app.use(globalLimiter);

// Allow BigInt in JSON responses
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function () {
  return this.toString();
};

app.use(express.json({ limit: "10kb" }));

// log every request to the console
morgan.token("date", (req) => formatDate(req._startTime));
morgan.token("err", (req, res) => (res._err ? ` - [${res._err}]` : "\u200b"));
app.use(
  morgan("\x1b[94m[:date]\x1b[0m \x1b[93m:remote-addr\x1b[0m :method :status :url:err - :response-time ms"),
);

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /\n");
});

app.get("/", (req, res) => {
  console.info(`Received request for root endpoint; app version is ${process.env.npm_package_version}`);
  res.send({ success: true });
});

app.use("/auth", AuthRouter);
app.use("/crowdin", CrowdinRouter);
app.use("/discord", DiscordRouter);
app.use("/docker", DockerRouter);
app.use("/rss", RssRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler (must stay last)
app.use(
  (error: Error & { status?: number; type?: string }, req: Request, res: Response, next: NextFunction) => {
    // Malformed JSON: keep the existing behaviour
    if (error.type === "entity.parse.failed") {
      res.status(400).send("Invalid JSON body");
      return;
    }

    // Other client errors (413, 415...): status line only, no details
    const status = error.status && error.status < 500 ? error.status : 500;
    if (status === 500) console.error(error.stack);
    res.status(status).send(status === 500 ? "Internal server error" : STATUS_CODES[status]);
  },
);

app.listen(port, "localhost", () => {
  console.info(`App V${process.env.npm_package_version} is running on http://localhost:${port} !`);
});
