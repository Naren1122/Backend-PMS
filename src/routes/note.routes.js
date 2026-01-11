import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getAllNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/note.controllers.js";
import {
  createNoteValidator,
  updateNoteValidator,
  projectIdParamValidator,
  noteIdParamValidator,
} from "../middleware/note.validators.js";
import { validate } from "../middleware/validator.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Note routes
router
  .route("/:projectId")
  .get(projectIdParamValidator(), validate, getAllNotes)
  .post(
    projectIdParamValidator(),
    validate,
    createNoteValidator(),
    validate,
    createNote
  );

router
  .route("/:projectId/n/:noteId")
  .get(projectIdParamValidator(), noteIdParamValidator(), validate, getNoteById)
  .put(
    projectIdParamValidator(),
    noteIdParamValidator(),
    validate,
    updateNoteValidator(),
    validate,
    updateNote
  )
  .delete(
    projectIdParamValidator(),
    noteIdParamValidator(),
    validate,
    deleteNote
  );

export default router;
