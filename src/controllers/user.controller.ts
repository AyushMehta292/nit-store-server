import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sendRegMail } from "../mailer/sendRegOtp.js";

import { IUser } from "../interfaces/index.js";
const generateAccessAndRefereshTokens = async (userName: string) => {
    try {
        const user = (await User.findOne({userName})) as IUser;
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
export const signUp = asyncHandler(async (req: Request, res: Response) => {
    const {
        userName,
        email,
        fullName,
        password,
    }: { userName: string; email: string; fullName: string; password: string } =
        req.body;

    [userName, email, fullName, password].map((ele) => {
        ele.trim();
    });
    if (
        [fullName, email, userName, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existedUser) {
        throw new ApiError(
            400,
            "User already exists. Change email or username"
        );
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    // console.log("Files ", files);

    const avatarLocalPath = files?.avatar ? files.avatar[0].path : "";
    // console.log("Avatar Local Path ", avatarLocalPath);
    const coverImageLocalPath = files?.coverImage
        ? files.coverImage[0].path
        : "";
    // console.log("Cover Image Local Path ", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(
            400,
            "Avatar file is required while to be uploaded on cloudinary"
        );
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),
    });

    // console.log("User ", user);

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(201)
        .json(
            new ApiResponse({
                statusCode: 200,
                data: createdUser,
                message: "User registered Successfully",
            })
        )
        .cookie("userName", createdUser.userName, options);
});

export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
    const { userName } = req.cookies;

    const user = await User.findOne({ userName });
    if (!user) {
        throw new ApiError(404, "User not registered");
    }

    const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = generatedOTP;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); //otp expires in 10 minutes

    await user.save({ validateBeforeSave: false });

    await sendRegMail(user.email, userName, generatedOTP);

    return res.json(
        new ApiResponse({
            statusCode: 200,
            data: null,
            message: "OTP sent successfully",
        })
    );
});
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { userName } = req.cookies;
    if (!userName) {
        throw new ApiError(400, "Username is required");
    }

    const user = await User.findOne({ userName });

    if (!user) {
        throw new ApiError(404, "User not registered");
    }

    const { otp }: { otp: String } = req.body;
    if (!otp) {
        throw new ApiError(400, "OTP is required");
    }

    if (
        user.otp === otp.trim() &&
        user.otpExpires &&
        user.otpExpires > new Date()
    ) {
        user.otp = undefined;
        user.otpExpires = undefined;

        user.isVerified = true;

        await user.save({ validateBeforeSave: false });
    } else {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    return res.json(
        new ApiResponse({
            statusCode: 200,
            data: undefined,
            message: "User verified successfully",
        })
    );
});
export const signIn = asyncHandler(async (req: Request, res: Response) => {
    const {
        userName,
        email,
        password,
    }: { userName: string; email: string; password: string } = req.body;

    if (!password || !(userName || email)) {
        throw new ApiError(400, "Username and Password are required");
    }
    [userName, email, password].map((ele) => {
        ele.trim();
    });
    const user = await User.findOne({
        $or: [{ userName }, { email }],
    });
    if (!user || !user.isVerified) {
        throw new ApiError(404, "User not registered or not verified");
    }
    if (!(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid password");
    }
    const { accessToken, refreshToken } =
        await generateAccessAndRefereshTokens(userName);
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .json(
            new ApiResponse({
                statusCode: 200,
                message: "User logged in successfully",
            })
        )
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options);
});

import { IUserWithoutSensitiveInfo } from "../interfaces/index.js";
interface newReq extends Request {
    user?: IUserWithoutSensitiveInfo;
}
export const signOut = asyncHandler(async (req: newReq, res: Response) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshToken: 1, // this removes the field from document
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .clearCookie("userName", options)
        .json(new ApiResponse({ statusCode: 200, message: "User logged Out" }));
});

export const changeCurrentPassword = asyncHandler(
    async (req: newReq, res: Response) => {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            throw new ApiError(400, "All fields are required");
        }
        const user = await User.findById(req.user?._id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid old password");
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Password changed successfully",
            })
        );
    }
);

export const updateAccountDetails = asyncHandler(         //This route might need to be updated
    async (req: newReq, res: Response) => {
        const { fullName, email } = req.body;

        [fullName, email].map((ele) => {
            ele.trim();
        });
        if (!(fullName || email)) {
            throw new ApiError(400, "Not a valid request");
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            throw new ApiError(400, "Email already exists");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email,
                    isVerified: false,
                },
            },
            { new: true }
        ).select("-password -refreshToken");

        return res
            .status(200)
            .json(
                new ApiResponse({
                    statusCode: 200,
                    data: user,
                    message: "Account details updated successfully",
                })
            );
    }
);

// import jwt from "jsonwebtoken";
// export const testing = asyncHandler(async (req: Request, res: Response) => {
//   try {
//     const token = jwt.sign(
//       {
//         _id: "123456",
//         userName: "test",
//         email: "test@gmail.com",
//       },
//       "ASDFGH",
//       { expiresIn: "30s" }
//     );
//     console.log(" token ", token);
//     jwt.verify(token, "ASDFGH");

//     return res.json({ message: "Testing route" });
//   } catch (error) {
//     const {token} = req.cookies;

//   }
// });
