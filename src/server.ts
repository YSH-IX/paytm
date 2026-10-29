import { Router } from "express";
import { authRouter } from "./routes/authRoutes";
import { balanceRouter } from "./routes/balanceRoutes";
import { searchRouter } from "./routes/searchRoutes";
import { transactionRouter } from "./routes/transactionRoutes";
import { allUsersRouter } from "./routes/userRoutes";
import { walletRouter } from "./routes/walletRoutes";

const appRouter = Router()

appRouter.use("/auth", authRouter);
appRouter.use("/search", searchRouter);
appRouter.use("/users", allUsersRouter);
appRouter.use("/balance", balanceRouter);
appRouter.use("/wallet", walletRouter);
appRouter.use("/transactions", transactionRouter);


export{appRouter}