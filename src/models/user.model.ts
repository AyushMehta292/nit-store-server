import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";

import { IUser } from "../interfaces/index.js";

const userSchema = new Schema<IUser>(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        otp:{
            type: String
        },
        otpExpires : {
            type: Date
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        productsPurchaseHistory: [              // Supposing that the user will not purchase lot of products that will make the array too big
            {
                type: Schema.Types.ObjectId,
                ref: "Product"
            }
        ],
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = genSaltSync(10);
    this.password = await hashSync(this.password, salt);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return compareSync(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

export const User = mongoose.model<IUser>("User", userSchema);
