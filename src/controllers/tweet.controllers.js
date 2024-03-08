import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const tweet = await Tweet.create({
        content,
        owner: user._id
    })

    return(
        res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"))
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const userTweet = await Tweet.find({ owner: user._id })
    return(
        res
        .status(200)
        .json(new ApiResponse(200, userTweet, "User tweets fetched successfully"))
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet  = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet is not found")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (tweet.owner.toString() !== user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    const content = req.body
    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    tweet.content = content
    await tweet.save({validateBeforeSave: false})

    return(
        res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"))
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const tweetId = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (tweet.owner.toString() !== user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    tweet.remove()
    return(
        res
        .status(200)
        .json(new ApiResponse(200, null, "Tweet deleted successfully"))
    )


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}