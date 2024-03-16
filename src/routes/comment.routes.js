import { Router } from "express";
import { getVideoComments, addComment, updateComment, deleteComment }
from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyJWT);

router
.route("/:videoId")
.get(getVideoComments)
.post(addComment)

router
.route("/:commentId")
.patch(updateComment)
.delete(deleteComment)

export default router