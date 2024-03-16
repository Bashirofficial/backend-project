import { Router } from 'express';
import { getChannelStats, getChannelVideos } from '../controllers/dashboard.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
 

const router = Router();
router.use(verifyJWT);

router.route("/stats/:channelId").get(getChannelStats)
router.route("/videos/:channelId").get(getChannelVideos)

export default router