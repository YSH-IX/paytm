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
import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is missing.");
const jwtSecret = JWT_SECRET;

const authRouter = Router();
const SALT_ROUNDS = process.env.SALT_ROUNDS;
if (!SALT_ROUNDS) throw new Error("SALT_ROUNDS is missing");
const saltRounds = SALT_ROUNDS;

async function hashPassword(password: string) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

authRouter.post("/signup", async (req: Request, res: Response) => {
  // console.log("signup");

  const result = createUserSchema.safeParse(req.body);
  try {
    if (result.success) {
      const { email, password, username } = result.data;

      const hashedPassword = await hashPassword(password);
      if (hashedPassword) {
        const existingUser = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (existingUser) {
          return res.status(202).json({
            message: `User already exist with ${email}, Login to continue`,
          });
        }

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
      const { email, password } = result.data;
      const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });
      if (user) {
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect) {
          const accessToken = jwt.sign(
            {
              id: user.id,
              tokenType: "access",
            },
            jwtSecret,
            { expiresIn: "1m" },
          );
          const refreshToken = crypto.randomBytes(64).toString("hex");
          const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

          const storeHash = await prisma.session.create({
            data: {
              refreshTokenHash,
              userId: user.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
          res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,

            // secure: process.env.NODE_ENV === "production",
          });
          res.cookie("access_token", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,

            // secure: process.env.NODE_ENV === "production",
          });
          if (storeHash) {
            return res.status(202).json({
              message: "Log In successful.",
            });
          }
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

export { authRouter };
