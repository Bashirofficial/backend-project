import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const pageNumber = parseInt(page)
    const pageLimit = parseInt(limit)
    const skip = (pageNumber - 1) * pageLimit
    const pageSize = pageLimit

    const videos = await Video.aggregate([
        {
            $match:{ 
                title: { $regex: query, $options: 'i'  },//$regex: new RegExp(query, 'i')
            //$regex is for regular expression i is for case insensitive
             isPublished: true,
             owner: user._id   
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1//sortType === "asc" ? 1 : -1: 
                //This is a ternary operator that checks the value of sortType. 
                //If sortType is "asc", it assigns 1 (for ascending order); 
                //otherwise, it assigns -1 (for descending order).
            }
        },
        {
            $skip: skip
        },
        {
            $limit: pageSize
        },
        {
            $lookup: {
                from: "users", //collection name
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            isPublished: 1,
                            owner: 1,
                            createdAt: 1,
                            updatedAt: 1

                        }
                    }
                ]
            }
        },
        
    ])

    if(videos.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "No videos found"))
    }

    return(
    res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))
    )

    
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    //Get title and description from req.body
    //get video and thumbnail from req.files
    //upload on cloudinary
    //upload on db
    const { title, description} = req.body

    console.log(title);

    if(!title){
        throw new ApiError(400, "Title is required")   
    }

    const videoLocalPath = req.file?.videoFile?.[0]?.path
    if(!videoLocalPath) {
        throw new ApiError(400, "Video file not found")
    }

    const thumbnailLocalPath = req.file?.thumbnail?.[0].path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail not found")
    }

    const videoFile  =  await uploadOnCloudinary (videoLocalPath)
    if (!videoFile) {
        throw new ApiError(400, "video file is not uploaded on cloudinary")
    }

    const thumbnail = await uploadOnCloudinary (thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(400, "thumbnail is not uploaded on cloudinary")
    }

    const user = await User.findById(req.user?._id)

    const video = await Video.create({
        videoFile: videoFile.url, // videoFile: videoFile.secure_url,
        thumbnail: thumbnail.url, 
        title: title,
        description: description || "",
        duration: videoFile.duration,
        owner: user._id

    })

    return(
    res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"))    
    )


})

const getVideoById = asyncHandler(async (req, res) => {
   
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    return(
         res
         .status(200)
         .json(
            new ApiResponse(200, video, "Video is successfully fetched")
            )
        )
})
        

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    if (video.owner.toString() !== user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const { title, description, thumbnail } = req.body

    if (!title) {
        throw new ApiError(400, "Title is required")
    }

    if (!description) {
        throw new ApiError(400, "Description is required")
    }

    video.title = title
    video.description = description 

    const thumbnailLocalPath = req.file?.thumbnail?.[0].path 
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail not found")
    }

    thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail not uploaded on cloudinary")
    }

    video.thumbnail = thumbnail.url
    await video.save()

    return(
        res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"))
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (video.owner.toString() !== user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }


    await video.remove()
    return(
        res
        .status(200)
        .json(new ApiResponse(200, null, "Video deleted successfully"))
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!(videoId)) {
        throw new ApiError(400, "Video id cannot be fetched")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave : false})

    return(
        res
        .status(200)
        .json(new ApiResponse(200, video, "Video publish status updated successfully"))
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}