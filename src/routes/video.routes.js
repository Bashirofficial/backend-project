import { Router } from 'express';
import { getAllVideos, getVideoById, updateVideoById,deleteVideo,
togglePublishStatus } 
from '../controllers/video.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/multer.middleware';

const router = Router();
router.route("/publish-video").post(verifyJWT,
     upload.fields([
            {
                name: "thumbnail",
                maxCount: 1
            },
            {
                name: "video",
                maxCount: 1
            }
    ]),
    publishAVideo);

router.route("/get-all-videos").get( getAllVideos );

router
.route("/:videoId")
.get( verifyJWT, getVideoById )
.patch( verifyJWT, upload.single("thumbnail"), updateVideoById )
.delete( verifyJWT, deleteVideo )

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router