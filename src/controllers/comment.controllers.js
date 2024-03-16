import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
 

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const comments = await Comment.find({ videoId: videoId })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .exec();

    const count = await Comment.countDocuments({ videoId: videoId });

    return(
        res
        .status(200)
        .json(new ApiResponse({
            comments,
            totalPages: Math.ceil(count / limit),
            currentPage: page
            })
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const videoId = req.params
    const content = req.body

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await  Comment.create({
        content: content,
        video:video._id,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Error adding comment")
    }

    return(
        res
        .status(201)
        .json(new ApiResponse(200,comment, "Comment added successfully"))
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const commentId = req.params
    const content = req.body
    


    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    const user = req.user._id
    if (!user) {
        throw new ApiError(401, "You must be logged in to update a comment")
    }
   
    if (comment?.owner.toString() !== user.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }


    comment.content = content
    await comment.save({validateBeforeSave: false})

    return(
        res
        .status(200)
        .json(new ApiResponse(200,comment, "Comment updated successfully"))
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const commentId = req.params
    const user = req.user._id
    if (user) {
        throw new ApiError(401, "You must be logged in to delete a comment")
    }

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment?.owner.toString() !== user.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    await comment.remove()

    return(
        res
        .status(200)
        .json(new ApiResponse(200,{}, "Comment deleted successfully"))
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }