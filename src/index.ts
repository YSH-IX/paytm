import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { appRouter } from "./server";
import cors from "cors";

const app: Express = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 3001;
if (!PORT || typeof PORT === undefined) throw new Error("PORT is missing !!");

app.use("/api/v1", appRouter);
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
 
