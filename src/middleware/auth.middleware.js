import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", ""); // this code simply check if the token is present in the cookies or in the header of the request.

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // this code helps to verify the token if it is real or not.

    //check all the user by id if the user is present or not.
    const user = await User.findById(decodedToken?._id).select(
      // hide the sensitive info from the user.
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );
    if (!user) {
      throw new ApiError(401, "Invalid access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid access Token");
  }
});
