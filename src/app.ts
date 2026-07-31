import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";

export function createApp(): Express {
  const app = express();

  app.use(morgan("dev"));
  app.use(express.json({ limit: "20mb" }));
  app.use(cors());

  app.use("/api", routes);

  app.get("/", (_req, res) => {
    res.send("GoldFlowin API is running");
  });

  // Must be registered LAST - see shared/middlewares/errorHandler.ts.
  app.use(errorHandler);

  return app;
}
