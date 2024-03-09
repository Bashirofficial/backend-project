import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if (!(name) ) {
        throw new ApiError(400, "Name is required")
    }

    const playlist = await Playlist.create({
        name:name,
        description: description,
        owner: req.user?._id  
    })

    if (!playlist) {
        throw new ApiError(500, "Playlist not created")
    }

    return(
        res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"))
    )


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const playlists = await Playlist.find({owner: userId})
    if (!playlists) {
        throw new ApiError(404, "Playlists not found")
    }

    return(
        res
        .status(200)
        .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return(
        res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const isVideoInPlaylist = await playlist.videos.includes(videoId)
    if (isVideoInPlaylist) {
        throw new ApiError(400, "Video already in playlist")
    } else if(playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to add video to this playlist")
    } else {
        playlist.videos.push(videoId)
        await playlist.save()
    }

    return(
        res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const isVideoInPlaylist = await playlist.videos.includes(videoId)
    if (!isVideoInPlaylist) {
        throw new ApiError(400, "Video not in playlist")
    } else if(playlist.owner.toString() !== req.user?._id.toString()) { 
        throw new ApiError(403, "You are not authorized to remove video from this playlist")
    } else {
        playlist.videos.pull(videoId)
        await playlist.save()
    }

    return(
        res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist")
    } else {
        await playlist.remove()
    }

    return(
        res
        .status(200)
        .json(new ApiResponse(200, null, "Playlist deleted successfully"))
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if (!name) {
        throw new ApiError(400, "Name is required")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    playlist.name = name
    playlist.description = description
    const updatedPlaylist = await playlist.save()

    
    // const updatedPlaylist = await Playlist.findByIdAndUpdate(
    //    playlistId,
    //    {
    //          $set:{
    //           name: name,
    //          description: description
    //          }
    //    },
    //    {
    //        new: true
    //    }
    //)

    return(
        res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}