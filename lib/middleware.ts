import { type Response, type Request, type NextFunction } from "express";

import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

export interface AuthenticateRequest extends Request {
  user?: {
    id: number;
  };
}


const authenticator = (
  req: AuthenticateRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(402).json({
        message: "Auth Header is missing !!",
      });
    }

    console.log(authHeader);
    

    const token = authHeader?.split(" ")[1];
    if (!token) {
      return res.status(402).json({
        message: "Token is missing !!",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log(decoded);
    

    if (decoded.tokenType === "access") {
      req.user = {
        id: decoded.id,
      };
      next();
    } else {
      return res.status(401).json({
        message: decoded,
      });
    }
  } catch (error) {
    console.error("Middleware error : ", error);
    res.status(400).json({
      message: error,
    });
  }
};

export { authenticator };
