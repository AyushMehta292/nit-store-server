import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

import { IUser } from "../interfaces/index.js";
import { IUserWithoutSensitiveInfo } from "../interfaces/index.js";
interface DecodedToken {
  _id: string;
  userName: string;
  email: string;
  fullName: string;
}

interface newReq extends Request {
  user?: IUserWithoutSensitiveInfo;
}

const generateAccessAndRefereshTokens = async (userName: string) => {
  try {
    const user = (await User.findById(userName)) as IUser;
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

export const verifyJWT = asyncHandler(async (req: newReq, res: Response, next: NextFunction) => {

      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      // console.log(token);
      if (!token) {
        throw new ApiError(401, "[Auth middleware] Unauthorized request");
      }

      try {
        const decodedToken = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET as string
        ) as DecodedToken;

        const user = (await User.findById(decodedToken?._id).select(
          "-password -refreshToken -otp -otpExpires -productsPurchaseHistory -isPasswordCorrect -generateAccessToken -generateRefreshToken"
        )) as IUserWithoutSensitiveInfo;

        if (!user) {
          throw new ApiError(401, "[Auth middleware] Invalid Access Token");
        }

        req.user = user;
        return next();
      } catch (error: Error | any) {

        const refreshToken: string = req.cookies?.refreshToken;

        if (error.name === "TokenExpiredError" && refreshToken) {
            try {
                const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as { _id: string };
                const user = (await User.findById(decodedToken._id)) as IUser;
                if (!user) {
                    throw new ApiError(401, "[Auth middleware] Invalid refresh token");
                }
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user.userName);

                const userWithoutSensitiveInfo = {
                  userName: user.userName,
                  email: user.email,
                  fullName: user.fullName,
                  avatar: user.avatar,
                  coverImage: user.coverImage, 
                  isVerified: user.isVerified,
                  isAdmin: user.isAdmin,
                } as IUserWithoutSensitiveInfo;

                req.user = userWithoutSensitiveInfo;

                const options = {
                  httpOnly: true,
                  secure: true,
                };
                res.cookie("accessToken", newAccessToken, options);
                res.cookie("refreshToken", newRefreshToken, options);
                return next();
            } catch (error) {
                throw new ApiError(401, "[Auth middleware] Invalid refresh token");
            }
        }
        else {
            throw new ApiError(
                401,
                error?.message || "[Auth middleware] Invalid access token"
              );
        }
    } 
  }
);
