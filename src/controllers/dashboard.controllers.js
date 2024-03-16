import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.params
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channel = await Subscription.findbyId(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalViews: 1
            }
        }
    ])

    //Total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    //Total videos
    const totalVideos = await Video.countDocuments({
        owner: channelId
    })

    //Total likes
    const totalLikes = await Like.countDocuments({
        video: {
            $in: await Video.find({
                owner: channelId
            }).distinct("_id")
        }
    })

    return(
        res
        .status(200)
        .json(
            new ApiResponse(200, {
                totalViews: totalViews[0]?.totalViews || 0,
                totalSubscribers,
                totalVideos,
                totalLikes
            }, "Channel stats fetched successfully")
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelId} = req.params
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channel = await Subscription.findbyId(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const videos = await Video.find({
        owner:channelId
    }).sort("-createdAt")

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found")
    }

    return(
        res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Videos fetched successfully")
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }