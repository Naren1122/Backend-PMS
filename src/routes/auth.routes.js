import { Router } from "express";
import {
  registerUser,
  login,
  logoutUser,
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  resetForgotPassword,
  verifyEmail,
  refreshAccessToken,
  resendEmailVerification,
} from "../controllers/auth.controllers.js";
import { validate } from "../middleware/validator.middleware.js";
import {
  userChangeCurrentPasswordValidator,
  userLoginValidator,
  userRegisterValidator,
  userResetForgotPasswordValidator,
} from "../validators/index.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import { userForgotPasswordValidator } from "../validators/index.js";

const router = Router();

//unsecured routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);

router.route("/login").post(userLoginValidator(), validate, login);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/verify-email/:verificationToken").get(verifyEmail);

router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);

router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword
  );
router
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification);
export default router;
