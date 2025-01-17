import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendOTP } from "../utils/email.util.js"; // Import the sendOTP utility
import { ApiResponse } from "../utils/apiResponse.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";

export const signup = asyncHandler(async (req, res, next) => {
    const {
        shopifyAccessToken,
        firstName,
        lastName,
        email,
        contactNumber,
        password,
        address,
        ...otherData
    } = req.body;

    if (!shopifyAccessToken) {
        return next(new ApiError("Shopify Access Token is required", 400));
    }

    // Generate OTP and its expiration time
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    const user = new User({
        shopifyAccessToken,
        firstName,
        lastName,
        email,
        contactNumber,
        password,
        address,
        ...otherData,
        otp,
        otpExpiry,
    });

    await user.save();

    // Use sendOTP utility to send OTP
    await sendOTP(email, otp);

    sendToken(user, 201, "User registered successfully. Please verify OTP.", res);
});

export const verifyUser = asyncHandler(async (req, res, next) => {
    const { businessEmail, otp } = req.body;

    const user = await User.findOne({ businessEmail });

    if (!user) {
        return next(new ApiError("User not found", 404));
    }

    if (user.otp !== otp) {
        return next(new ApiError("Invalid OTP", 400));
    }

    if (new Date() > user.otpExpiry) {
        return next(new ApiError("OTP expired", 400));
    }

    user.isApproved = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json(new ApiResponse("OTP verified successfully"));
});

// Keep other functions unchanged unless additional modifications are needed

export const signin = asyncHandler(async (req, res, next) => {
    const { businessEmail, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ businessEmail });

    if (!user) {
        return next(new ApiError("User not found", 404));
    }

    // Check if the password matches (use bcrypt or any hashing library for real-world projects)
    if (user.password !== password) {
        return next(new ApiError("Invalid credentials", 401));
    }

    // If credentials are valid, send the token
    sendToken(user, 200, "Login successful", res);
});


export const signout = asyncHandler(async (req, res, next) => {
    // Logic for signing out the user
});

export const getCurrentUser = asyncHandler(async (req, res, next) => {
    // Logic for retrieving current user details
});

export const changeCurrentPassword = asyncHandler(async (req, res, next) => {
    // Logic for changing the current user's password
});

export const updateUserDetails = asyncHandler(async (req, res, next) => {
    // Logic for updating user details
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
    // Logic for handling forgot password functionality
});

export const resetPassword = asyncHandler(async (req, res, next) => {
    // Logic for handling password reset functionality
});

export const getUserDetails = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ApiError("User not found", 404));
    }

    res.status(200).json(user);
});
