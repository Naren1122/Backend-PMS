import { body, param, query } from "express-validator";
import { AvailableTaskStatus } from "../utils/constant.js";
import mongoose from "mongoose";

// Validator for creating a task
export const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("assignedTo")
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid user ID");
      }
      return true;
    }),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be one of: low, medium, high"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
];

// Validator for updating a task
export const updateTaskValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("assignedTo")
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid user ID");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(AvailableTaskStatus)
    .withMessage(`Status must be one of: ${AvailableTaskStatus.join(", ")}`),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be one of: low, medium, high"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
];

// Validator for task ID parameter
export const taskIdParamValidator = [
  param("taskId").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid task ID");
    }
    return true;
  }),
];

// Validator for project ID parameter
export const projectIdParamValidator = [
  param("projectId").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid project ID");
    }
    return true;
  }),
];

// Validator for listing tasks with filters
export const listTasksValidator = [
  query("status")
    .optional()
    .isIn(AvailableTaskStatus)
    .withMessage(`Status must be one of: ${AvailableTaskStatus.join(", ")}`),

  query("assignedTo")
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid user ID");
      }
      return true;
    }),

  query("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be one of: low, medium, high"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "dueDate", "priority"])
    .withMessage("Sort field must be one of: createdAt, dueDate, priority"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be either asc or desc"),
];
