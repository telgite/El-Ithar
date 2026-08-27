import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();

const PgStore = connectPg(session);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const isProduction = process.env.NODE_ENV === "production";

// Trust Replit's reverse proxy so req.secure === true on HTTPS connections.
// Without this, express-session sees the internal HTTP socket and silently
// drops Set-Cookie when cookie.secure === true (production), meaning the
// browser never receives a session cookie and every write endpoint returns 401.
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: new PgStore({ pool, createTableIfMissing: true }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      // SameSite=lax allows the cookie to be sent on same-site requests
      // including cross-port (API server ↔ website proxy).
      // In production with secure cookies, SameSite=none is required
      // for the proxied cross-origin context.
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use("/api", router);

export default app;
