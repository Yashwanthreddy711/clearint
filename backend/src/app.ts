// src/app.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
import authRoutes from "./routes/auth.routes";
app.use("/api/auth", authRoutes);

// Example route
app.get('/', (_req, res) => {
  res.send('API is running...');
});

export default app;
