import express, { type Express } from "express";
import { authRouter } from "./routes/authRoutes";
import { searchRouter } from "./routes/searchRoutes";
import { allUsersRouter } from "./routes/userRoutes";
import { balanceRouter } from "./routes/balanceRoutes";
import { walletRouter } from "./routes/walletRoutes";
import { transactionRouter } from "./routes/transactionRoutes";

const app: Express = express();
app.use(express.json());

const PORT = process.env.PORT;
if (!PORT || typeof PORT === undefined) throw new Error("PORT is missing !!");

app.use("/auth", authRouter);
app.use("/search", searchRouter);
app.use("/users", allUsersRouter);
app.use("/balance", balanceRouter);
app.use("/wallet", walletRouter);
app.use("/transactions", transactionRouter);

app.listen(PORT, () => {
  console.log("Server is running at http://localhost:3000");
});
