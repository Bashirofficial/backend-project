import { Router } from 'express';
import {createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, 
removeVideoFromPlaylist, deletePlaylist, updatePlaylist } 
from '../controllers/playlist.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
 

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist)

router
.route("/:playlistId")
.get(getPlaylistById)
.delete(deletePlaylist)
.patch(updatePlaylist)

router.route("/user/:userId").get(getUserPlaylists)

router.route("/add/:videoId/:playlistId").post(addVideoToPlaylist)
router.route("/delete/:videoId/:playlistId").delete(removeVideoFromPlaylist)

export default router