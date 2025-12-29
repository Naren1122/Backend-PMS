import { body } from "express-validator";

const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail() // should be in email format
      .withMessage("Email is not valid"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase() // should be in lowercase
      .withMessage("Username should be in lowercase")
      .length({ min: 3 })
      .withMessage("Username should be at least 3 characters long"),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password should be at least 6 characters long")
      .matches(/\d/)
      .withMessage("Password should contain at least one number")
      .matches(/[a-z]/)
      .withMessage("Password should contain at least one lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password should contain at least one uppercase letter")
      .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
      .withMessage("Password should contain at least one special character"),

    body("fullname").optional().trim(),
  ];
};
export { userRegisterValidator };
