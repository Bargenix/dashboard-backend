import CompanyDetails from "../models/companyDetails.model.js"; // Default importimport { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from "../utils/asyncHandler.js";

// Controller to get company details by userId
const getCompanyByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Fetch company details from the database
  const company = await CompanyDetails.findOne({ userId }).populate('userId', 'firstName lastName email contactNumber linkedInUrl designation');

  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  // Return the company details
  return res.status(200).json(
    new ApiResponse(200, company, "Company details fetched successfully")
  );
});

export { getCompanyByUserId };