import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/smtp.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sendToken } from "../utils/sendToken.js";
import { CompanyDetails } from "../models/companyDetails.model.js";
import { ShopifyDetails } from "../models/shopifyDetails.model.js";

export const signup = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, contactNumber, password, designation, linkedInUrl, companyName, companyWebsite, employeeSize, kindsOfProducts, country, state, city, shopifyAccessToken, shopifyShopName } = req.body;

    // console.log("Received signup request for:", email); // Debug log

    // Check for existing user
    const existingUser = await User.findOne({
        $or: [{ email }, { contactNumber }]
    });

    if (existingUser) {
        throw new ApiError(400, "User with email or contact number already exists");
    }

    // Create new user
    const user = await User.create({
        firstName,
        lastName,
        email,
        contactNumber,
        password,
        designation,
        linkedInUrl,
        isUserVerified: false
    });

    // Generate OTP
    const { OTP } = user.generateVerificationTokenAndOtp();
    await user.save();

    // Create company details
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

    // Create Shopify details if provided
    if (shopifyAccessToken && shopifyShopName) {
        await ShopifyDetails.create({
            accessToken: shopifyAccessToken,
            shopifyShopName,
            apiVersion: "2024-01",
            userId: user._id
        });
    }

    // Send OTP email
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
    console.log("Received request for verification:", req.body); // Log the request body

    const { email, otp } = req.body;

    if (!email || !otp) {
        console.error("Missing email or OTP in request");
        throw new ApiError(400, "Please provide both email and OTP");
    }

    console.log(`Finding user with email: ${email} and OTP: ${otp}`);
    const user = await User.findOne({
        email,
        verificationOTP: otp,
        isUserVerified: false
    });

    if (!user) {
        console.error("No user found with matching email and OTP");
        throw new ApiError(400, "Invalid OTP or email");
    }

    console.log("User found, marking as verified");
    user.isUserVerified = true;
    user.verificationOTP = undefined;
    await user.save();

    console.log("User verification successful, sending token");
    sendToken(user, 200, res, "Account verified successfully");
});


export const signin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Please provide email and password");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordMatched = await user.isPasswordCorrect(password);

    if (!isPasswordMatched) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isUserVerified) {
        // Generate new OTP for unverified users
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

    // Send email notification
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

    // Generate OTP for password reset
    const { OTP } = user.generateVerificationTokenAndOtp();
    user.resetPasswordToken = OTP;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
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