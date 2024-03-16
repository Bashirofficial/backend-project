import { Router } from 'express';
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels}
from '../controllers/subscription.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
 
const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file


router
.route("/c/:channelId")
.post(toggleSubscription)
.get(getUserChannelSubscribers)

router.route("/u/:subscriberId").get(getSubscribedChannels)

export default router