import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/smtp.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sendToken } from "../utils/sendToken.js";
import { CompanyDetails } from "../models/companyDetails.model.js";
import { ShopifyDetails } from "../models/shopifyDetails.model.js";
import { randomBytes } from "crypto";  


export const signup = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, contactNumber, password, designation, linkedInUrl, companyName, companyWebsite, employeeSize, kindsOfProducts, country, state, city, shopifyAccessToken, shopifyShopName } = req.body;

    const existingUser = await User.findOne({
        $or: [{ email }, { contactNumber }]
    });

    if (existingUser) {
        throw new ApiError(400, "User with email or contact number already exists");
    }

    const user = await User.create({
        firstName,
        lastName,
        email,
        contactNumber,
        designation,
        linkedInUrl,
        isUserVerified: false
    });

    const { OTP } = user.generateVerificationTokenAndOtp();
    await user.save();

    await CompanyDetails.create({
        companyName,
        companyWebsite,
        employeeSize,
        kindsOfProducts,
        country,
        state,
        city,
        userId: user._id
    });

    await sendEmail({
        email: user.email,
        subject: "Verify Your Email - Bargenix",
        message: `Your verification OTP is: ${OTP}. This OTP will expire in 15 minutes.`
    });

    res.status(201).json(
        new ApiResponse(201, "Registration successful. Please check your email for OTP verification.")
    );
});



export const verifyUser = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Please provide both email and OTP");
    }

    const user = await User.findOne({
        email,
        verificationOTP: otp,
        isUserVerified: false
    });

    if (!user) {
        return next(new ApiError(400, "Invalid OTP or email"));
    }

    const password = randomBytes(8).toString('hex'); 

    user.password = password;
    user.isUserVerified = true;
    user.verificationOTP = undefined;
    await user.save();

    await sendEmail({
        email: user.email,
        subject: "Account Verified - Bargenix",
        message: `Your account has been successfully verified. Your login credentials are as follows:\n\nUsername: ${user.email}\nPassword: ${password}\n\nPlease change your password after logging in.`
    });

    sendToken(user, 200, res, "Account verified and password sent successfully");
});


export const signin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Please provide email and password");
    }

    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordMatched = await user.isPasswordCorrect(password);

    if (!isPasswordMatched) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isUserVerified) {
        const { OTP } = user.generateVerificationTokenAndOtp();
        await user.save();

        await sendEmail({
            email: user.email,
            subject: "Verify Your Email - Bargenix",
            message: `Your verification OTP is: ${OTP}. This OTP will expire in 15 minutes.`
        });

        throw new ApiError(401, "Please verify your email first. New OTP has been sent.");
    }

    sendToken(user, 200, res);
});

export const signout = asyncHandler(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json(
        new ApiResponse(200, "Logged out successfully")
    );
});

export const getCurrentUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json(
        new ApiResponse(200, user)
    );
});

export const changeCurrentPassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Please provide both old and new password");
    }

    const user = await User.findById(req.user._id);

    const isPasswordMatched = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordMatched) {
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    await sendEmail({
        email: user.email,
        subject: "Password Changed - Bargenix",
        message: "Your password has been changed successfully. If you didn't make this change, please contact support immediately."
    });

    sendToken(user, 200, res, "Password changed successfully");
});

export const updateUserDetails = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, designation, linkedInUrl } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                firstName,
                lastName,
                designation,
                linkedInUrl
            }
        },
        { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json(
        new ApiResponse(200, user, "Profile updated successfully")
    );
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const { OTP } = user.generateVerificationTokenAndOtp();
    user.resetPasswordToken = OTP;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; 
    await user.save();

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Reset - Bargenix",
            message: `Your password reset OTP is: ${OTP}. This OTP will expire in 15 minutes.`
        });

        res.status(200).json(
            new ApiResponse(200, "Password reset OTP sent to email")
        );
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        throw new ApiError(500, "Error sending password reset email");
    }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new ApiError(400, "Please provide email, OTP and new password");
    }

    const user = await User.findOne({
        email,
        resetPasswordToken: otp,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await sendEmail({
        email: user.email,
        subject: "Password Reset Successful - Bargenix",
        message: "Your password has been reset successfully. If you didn't make this change, please contact support immediately."
    });

    sendToken(user, 200, res, "Password reset successful");
});