import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { cityRouter } from "./routes/cityRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(pinoHttp());
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "UP" });
});

app.use("/api/cities", cityRouter);

app.use(notFoundHandler);
app.use(errorHandler);
