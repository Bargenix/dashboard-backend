import { User } from "../models/user.model.js"
import { ApiResponse } from "./apiResponse.js"

export const sendToken = async(user, statusCode, res, message) => {
    const accessToken = user.generateAccessToken()

    await user.save({ validateBeforeSave: false })
    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: true
    }

    const loggedInUser = await User.findById(user._id);
  
    return res
    .status(statusCode)
    .cookie("bargenix_accessToken", accessToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user:loggedInUser, accessToken
            },
            message
        )
    )

  };