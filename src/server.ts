import dotenv from "dotenv";
import express, { Express } from "express";
import cors from "cors";
import dns from "node:dns";
import { loggerMiddleware } from "./Middelware/logger";
import router from "./routes/books";
import { initializeStorage } from "./storage";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");
const app: Express = express();
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const allowedOrigins = process.env.FRONTEND_URL?.split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(express.json());
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));
app.use(loggerMiddleware);
app.get("/health", (_req, res) => { res.status(200).json({ status: "ok" }); });
app.use("/v1/books", router);

const start = async () => {
  await initializeStorage();
  app.listen(PORT, "0.0.0.0", () => { console.log("Server is running on port " + PORT); });
};
start().catch((error) => { console.error("Unable to start server", error); process.exit(1); });
