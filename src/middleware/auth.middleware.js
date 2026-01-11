import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  console.log('[verifyJWT] Starting JWT verification...');
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  console.log('[verifyJWT] Token found:', !!token);

  if (!token) {
    console.log('[verifyJWT] No token provided');
    throw new ApiError(401, "Unauthorized request");
  }

  console.log('[verifyJWT] Verifying token...');
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  console.log('[verifyJWT] Token decoded, user ID:', decodedToken._id);

  console.log('[verifyJWT] Finding user...');
  const user = await User.findById(decodedToken._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  if (!user) {
    console.log('[verifyJWT] User not found');
    throw new ApiError(401, "Invalid access token");
  }

  console.log('[verifyJWT] User found, setting req.user');
  req.user = user;
  console.log('[verifyJWT] Calling next()');
  next(); // ✅ REQUIRED AND SAFE
});
