import {ApiError} from "../utils/apiError.js";

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  if(err.message === "jwt expired"){
    const message = `Session Expired`;
    err = new ApiError(400, message);
  }
  if(err.message === "jwt malformed"){
    const message = `Session Expired`;
    err = new ApiError(400, message);
  }
  // Wrong Mongodb Id error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ApiError(400, message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ApiError(400, message);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export {errorMiddleware};