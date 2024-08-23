import mongoose, {Document} from "mongoose";


interface IUser extends Document {
    userName: string;
    email: string;
    fullName: string;
    avatar: string;
    coverImage?: string;
    password: string;
    isVerified: boolean;
    otp?: string;
    otpExpires?: Date;
    isAdmin: boolean;
    productsPurchaseHistory: mongoose.Types.ObjectId[];
    refreshToken?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

type IUserWithoutSensitiveInfo = Omit<IUser, "password" | "refreshToken" | "productsPurchaseHistory" | "otp" | "otpExpires" | "isPasswordCorrect" | "generateAccessToken" | "generateRefreshToken">;


export { IUser, IUserWithoutSensitiveInfo }