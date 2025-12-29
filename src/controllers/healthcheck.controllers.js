import { ApiResponse } from "../utils/api-response.js";

import { asyncHandler } from "../utils/async-handler.js";

/*
const healthCheck = async (req, res, next) => {
  try {
    const user = await getUserFromDBB();
    res.status(200).json(new ApiResponse(204, { message: "Server is run" }));
  } catch (error) {
    next(error);
  }
};
*/

// this code help to avoid too many try catch
const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(204, { message: "Server is running" }));
});

export { healthCheck };
