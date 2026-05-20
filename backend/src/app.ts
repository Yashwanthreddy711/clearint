// src/app.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import testRoutes from "./routes/test.routes";

dotenv.config();

const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(bodyParser.json());
import authRoutes from "./routes/auth.routes";
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

// Example route
app.get('/', (_req, res) => {
  res.send('API is running...');
});

export default app;
