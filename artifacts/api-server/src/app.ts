import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Public directory is always at <artifact-root>/public
// ARTIFACT_DIR is set in the workflow env, fallback to relative from cwd
const artifactDir = process.env["ARTIFACT_DIR"] ?? path.resolve(process.cwd());
const frontendPath = path.join(artifactDir, "public");

logger.info({ frontendPath }, "Serving static files from");

app.use(express.static(frontendPath));

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

app.get("/admin/{*path}", (_req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;
