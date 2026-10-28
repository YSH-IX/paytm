import { Router, type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";
import {
  createUserSchema,
  updatePasswordSchema,
  updateUserSchema,
} from "../schemas/user.schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticator, type AuthenticateRequest } from "../../lib/middleware";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is missing.");

const authRouter = Router();
const saltRounds = 10;

async function hashPassword(password: string) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

authRouter.post("/signup", async (req: Request, res: Response) => {
  const result = createUserSchema.safeParse(req.body);
  try {
    if (result.success) {
      const { email, password, username } = result.data;
      const hashedPassword = await hashPassword(password);
      if (hashedPassword) {
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            username,
          },
        });

        return res.status(202).json({
          message: "Signed up successfully.",
          data: user,
        });
      }
    }
  } catch (error) {
    return res.status(404).json({
      message: error,
    });
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const result = createUserSchema.safeParse(req.body);
  try {
    if (result.success) {
      const { email, password, username } = result.data;
      const user = await prisma.user.findFirst({
        where: { email },
      });
      if (user) {
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect) {
          const userId = user.id;
          const token = jwt.sign({ userId, email }, JWT_SECRET, {
            expiresIn: 60 * 60,
          });
          return res.status(202).json({
            message: "Log In successfully.",
            token,
          });
        } else {
          return res.status(504).json({
            message: "Password didn't match.",
          });
        }
      } else {
        return res.status(502).json({
          message: `No account with Email : ${email}`,
        });
      }
    } else {
      res.status(502).json({
        message: result.error,
      });
    }
  } catch (error) {
    return res.status(404).json({
      message: error,
    });
  }
});

authRouter.put(
  "/update/password",
  authenticator,
  async (req: AuthenticateRequest, res: Response) => {
    const result = updatePasswordSchema.safeParse(req.body);
    const userId = req.user?.id;

    if (!userId || typeof userId === undefined)
      return res.status(502).send("userId is missing.");

    try {
      if (result.success) {
        const { password } = result.data;
        if (!password) return res.status(502).send("password is missing.");

        const newHashedPassword = await hashPassword(password);
        const updatedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            password: newHashedPassword,
          },
        });
        return res.status(202).json({
          message: "User details updated successfully.",
          data: updatedUser,
        });
      } else {
        res.status(502).json({
          message: result.error,
        });
      }
    } catch (error) {
      return res.status(404).json({
        message: error,
      });
    }
  },
);
authRouter.patch(
  "/update/userData",
  authenticator,
  async (req: AuthenticateRequest, res: Response) => {
    const result = updateUserSchema.safeParse(req.body);
    const userId = req.user?.id;

    if (!userId || typeof userId === undefined)
      return res.status(502).send("userId is missing.");

    try {
      if (result.success) {
        const { email, username } = result.data;

        const updatedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            email,
            username,
          },
        });
        return res.status(202).json({
          message: "User details updated successfully.",
          data: updatedUser,
        });
      } else {
        res.status(502).json({
          message: result.error,
        });
      }
    } catch (error) {
      return res.status(404).json({
        message: error,
      });
    }
  },
);

export { authRouter };
