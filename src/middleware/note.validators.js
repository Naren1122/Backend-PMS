import { body, param } from "express-validator";

// Validator for creating a note
export const createNoteValidator = () => {
  return [
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Title must be between 3 and 100 characters"),

    body("content")
      .notEmpty()
      .withMessage("Content is required")
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Content must be between 10 and 5000 characters"),
  ];
};

// Validator for updating a note
export const updateNoteValidator = () => {
  return [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Title must be between 3 and 100 characters"),

    body("content")
      .optional()
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Content must be between 10 and 5000 characters"),
  ];
};

// Validator for project ID parameter
export const projectIdParamValidator = () => {
  return [
    param("projectId")
      .notEmpty()
      .withMessage("Project ID is required")
      .isMongoId()
      .withMessage("Invalid project ID format"),
  ];
};

// Validator for note ID parameter
export const noteIdParamValidator = () => {
  return [
    param("noteId")
      .notEmpty()
      .withMessage("Note ID is required")
      .isMongoId()
      .withMessage("Invalid note ID format"),
  ];
};
