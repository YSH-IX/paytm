import { Router, type Request, type Response } from "express";
import { authenticator, type AuthenticateRequest } from "../../lib/middleware";
import { prisma } from "../../lib/prisma";
import { createWalletSchema } from "../schemas/wallet.schema";

const walletRouter = Router();

walletRouter.post(
  "/create",
  authenticator,

  async (req: AuthenticateRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId || typeof userId === undefined)
      return res.status(502).send("userId is missing.");

    const reqData = createWalletSchema.safeParse(req.body);

    if (!reqData.success) {
      return res.status(501).json({
        message: reqData.error,
      });
    }
    try {
      const { balance } = reqData.data;
      if (userId) {
        const hasWallet = await prisma.wallet.findFirst({
          where: {
            userId,
          },
        });

        if (hasWallet) {
          const { balance, userId, id } = hasWallet;
          return res.status(201).json({
            message: "Wallet already exists.",
            wallet: {
              balance: balance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              }),

              userId,
              id,
            },
          });
        }

        const result = await prisma.wallet.create({
          data: {
            userId,
            balance,
          },
        });

        if (result) {
          const { balance, id, userId } = result;
          return res.status(200).json({
            message: "Wallet created successfully.",
            wallet: {
              balance: balance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              }),

              userId,
              id,
            },
          });
        }
      }
    } catch (error) {
      res.status(401).json({
        message: error,
      });
    }
  },
);

export { walletRouter };
