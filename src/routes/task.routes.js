import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from "../controllers/task.controllers.js";
import {
  uploadAttachment,
  deleteAttachment,
} from "../controllers/attachment.controllers.js";
import {
  createTaskValidator,
  updateTaskValidator,
  taskIdParamValidator,
  projectIdParamValidator,
  listTasksValidator,
} from "../validators/task.validators.js";
import { validate } from "../middleware/validator.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Task routes
router
  .route("/:projectId")
  .get(
    projectIdParamValidator,
    validate,
    listTasksValidator,
    validate,
    getAllTasks
  )
  .post(
    projectIdParamValidator,
    validate,
    createTaskValidator,
    validate,
    createTask
  );

router
  .route("/:projectId/t/:taskId")
  .get(projectIdParamValidator, taskIdParamValidator, validate, getTaskById)
  .put(
    projectIdParamValidator,
    taskIdParamValidator,
    validate,
    updateTaskValidator,
    validate,
    updateTask
  )
  .delete(projectIdParamValidator, taskIdParamValidator, validate, deleteTask);

// Subtask routes
router.post(
  "/:projectId/t/:taskId/subtasks",
  projectIdParamValidator,
  taskIdParamValidator,
  validate,
  createSubtask
);

router.put(
  "/:projectId/st/:subTaskId",
  projectIdParamValidator,
  validate,
  updateSubtask
);

router.delete(
  "/:projectId/st/:subTaskId",
  projectIdParamValidator,
  validate,
  deleteSubtask
);

// Attachment routes
router.post(
  "/:projectId/t/:taskId/attachments",
  projectIdParamValidator,
  taskIdParamValidator,
  validate,
  upload.single("attachment"),
  uploadAttachment
);

router.delete(
  "/:projectId/t/:taskId/attachments/:attachmentId",
  projectIdParamValidator,
  taskIdParamValidator,
  validate,
  deleteAttachment
);

export default router;
