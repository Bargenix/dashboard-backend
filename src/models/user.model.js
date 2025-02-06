import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { USER_ROLES } from "../constants.js";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    firstName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    lastName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    contactNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        // required: true 
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: USER_ROLES[0],
    },
    designation: { 
        type: String 
    },
    linkedInUrl: {
      type: String,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, "Invalid LinkedIn URL"],
    },
    isUserVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: { 
        type: String 
    },
    verificationOTP: { 
        type: String 
    },
    resetPasswordToken: { 
        type: String 
    },
    resetPasswordExpire: { 
        type: Date 
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateVerificationTokenAndOtp = function () {

  const verifyToken = crypto.randomBytes(20).toString("hex");

  this.verificationToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  let digits = '0123456789'; 
  let OTP = ''; 
  let len = digits.length 
  for (let i = 0; i < 6; i++) { 
      OTP += digits[Math.floor(Math.random() * len)]; 
  } 

  this.verificationOTP = OTP;

  return {verifyToken, OTP};
}

userSchema.methods.getResetPasswordToken = function () {

    const resetToken = crypto.randomBytes(20).toString("hex");
  
    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
  
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  
    return resetToken;
};
  

export const User = mongoose.model("User", userSchema)