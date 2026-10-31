import { Router, type Request, type Response } from "express";
import { authenticator, type AuthenticateRequest } from "../../lib/middleware";
import { prisma } from "../../lib/prisma";
import { paymentSchema } from "../schemas/transaction.schema";

const balanceRouter = Router();

balanceRouter.get(
  "/",
  authenticator,

  async (req: AuthenticateRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId || typeof userId === undefined)
      return res.status(502).send("userId is missing.");

    try {
      if (userId) {
        const result = await prisma.wallet.findFirst({
          where: {
            userId,
          },
        });

        if (!result) {
          return res.status(400).json({
            message: "You have no wallet.",
            result,
          });
        }
        const { balance} = result;
        res.status(200).json({
          result: {
            balance: balance.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            }),
            id: result.id,
            userId: result.userId
          },
        });
      }
    } catch (error) {
      res.status(401).json({
        message: error,
      });
    }
  },
);

balanceRouter.post(
  "/send",
  authenticator,
  async (req: AuthenticateRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId || typeof userId === undefined)
      return res.status(502).send("userId is missing.");
    const userInput = paymentSchema.safeParse(req.body);
    if (!userInput.success) return res.json({ message: userInput.error });

    const { amount, recipient } = userInput.data;
    try {
      const sender = await prisma.wallet.findFirst({
        where: {
          userId,
        },
      });
      if (!sender)
        return res.json({
          message: `No wallet found with ${userId}`,
          sender,
        });

      if (sender?.balance < amount) {
        throw new Error("Insufficient balance.");
      }

      const receiver = await prisma.user.findFirst({
        where: {
          email: recipient,
        },
      });
      if (!receiver)
        return res.json({
          message: `No User found with ${recipient}`,
          sender,
        });
      const receiverWallet = await prisma.wallet.findFirst({
        where: {
          userId: receiver.id,
        },
      });

      if (!receiverWallet)
        return res.json({
          message: `${recipient} does not have a wallet.`,
          sender,
        });

      const transactionLog = await prisma.transaction.create({
        data: {
          amount,
          senderId: userId,
          receiverId: receiver.id,
          walletId: sender.id,
        },
      });

      if (transactionLog) {
        res.status(200).json({
          message: "Transaction log created",
          transactionLog,
        });
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const debit = await tx.wallet.update({
            data: {
              balance: {
                decrement: amount,
              },
            },
            where: { userId },
          });

          if (sender?.balance < amount) {
            throw new Error("Insufficient balance.");
          }

          return await tx.wallet.update({
            data: { balance: { increment: amount } },
            where: {
              userId: receiver.id,
            },
          });
        },
        {
          timeout: 10000, // 10 seconds timeout max
          isolationLevel: "Serializable", // Highest isolation for financial data
        },
      );
      if (result) {
        const log = await prisma.transaction.update({
          where: { id: transactionLog.id },
          data: {
            status: result ? "Completed" : "Failed",
          },
        });
        if (log) {
          res.status(202).json({
            message: "Transaction complete",
            log,
          });
        }
      }
    } catch (error) {
      res.status(502).json({
        message: error,
      });
    }
  },
);

export { balanceRouter };
