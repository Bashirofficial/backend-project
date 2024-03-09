import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const like = await Like.findOne({
        likedBy: req.user?._id,
        video: videoId
    })

    if (like) {
        await like.remove()
        return new ApiResponse(200, "Video unliked").send(res)
    } else {
        await Like.create({
            likedBy: req.user?._id,
            video: videoId
        })
        return new ApiResponse(200, "Video liked").send(res)
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    const commentLike = await Like.findOne({
        LikedBy: req.user?._id,
        comment: commentId
    })

    if(commentLike){
        await commentLike.remove()
        return new ApiResponse(200, "Comment unliked").send(res)
    } else {
        await Like.create({
            likedBy: req.user?._id,
            comment: commentId
        })
        return new ApiResponse(200, "Comment liked").send(res)
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const tweet  = await Tweet.findById(tweet)
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    const tweetLike = await Like.findOne({
        likedBy: req.user?._id,
        tweet: tweetId
    })

    if (tweetLike){
        await tweetLike.remove()
        return new ApiResponse(200, "Tweet unliked").send(res)
    } else {
        await Like.create({
            likedBy: req.user?._id,
            tweet: tweetId
        })
        return new ApiResponse(200, "Tweet liked").send(res)
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
   const user = req.user?._id
   if (!user){
       throw new ApiError(401, "Unauthorized")
   }
   const likes = await Like.find({likedBy: user, video: { $exists: true }}).populate("video")
   if (!likes){
       throw new ApiError(404, "No liked videos found")
   }
   //If you want the final response to contain just the video objects themselves, without any
   // additional fields from the like objects, then you should include this line. 
   //However, if you are interested in additional fields from the like objects or if you want to 
   //maintain the structure of the like objects, you can omit this line and return the likes array
   // directly.

   const likedVideos = likes.map(like=> like.video)

   return(
        res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos retrieved"))
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}