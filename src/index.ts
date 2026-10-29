import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { appRouter } from "./server";

const app: Express = express();
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT;
if (!PORT || typeof PORT === undefined) throw new Error("PORT is missing !!");

app.use("/api/v1", appRouter);
app.listen(PORT, () => {
  console.log("Server is running at http://localhost:3000");
});
