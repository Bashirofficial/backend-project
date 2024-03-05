import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";



const generateAccessAndRefreshTokens = async(userId) =>
 {
     try {
          const user = await User.findById(userId)
          const accessToken = user.generateAccessToken()
          const refreshToken = user.generateRefreshToken()

          user.refreshToken = refreshToken
          await user.save({ validateBeforeSave: false }) //while saving in db, mongoose model starts 
                                                        //kickin eg password is also required but 
                                                  //validateBeforeSave has been false for this reason
          return {accessToken, refreshToken}
     } catch (error) {
          throw new ApiError(500,"Something went wrong while generating Refresh and Access token")
     }
}

const registerUser = asyncHandler( async (req, res) => {
     // get user details from fronted
     // validation - not empty
     // check if user already exist: username, email
     // check for images, avator
     // upload them to cloudinary, avatar
     // create user object - create entry in db
     // remove password and refresh token field from response
     // check for user creation 
     // if yes then return response

     const {fullName, email, username, password} = req.body
     //console.log("email: ",email);

     if (
         [fullName, email, username, password].some((field) => 
         field?.trim() == "" ) 
     ) {
          throw new ApiError(400, "All fields are required")
     }

    const existedUser = await User.findOne({
          $or: [{ username }, { email }]   //checking username or email 
     })

     if (existedUser) {
          throw new ApiError(409, "User with email or username already exists")
     }
    // console.log(req.files);
     const avatarLocalPath = req.files?.avatar?.[0]?.path;  //[0] is first property and ? is optionally for checking
     const coverImagePath = req.files?.coverImage?.[0]?.path;
     //Another way to check, the classic way
     // let coverImageLocalPath;
     // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
     //        coverImageLocalPath = req.files.coverImage[0].path
     //   }



     if (!avatarLocalPath) {
          throw new ApiError(400, "Avatar file is required")
     }

    const avatar =  await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    if (!avatar) {
          throw new ApiError(400, "Avatar file is required")
    }

   const user = await User.create({
          fullName,
          avatar: avatar.url,
          coverImage: coverImage?.url || "",
          email,
          password,
          username: username.toLowerCase()
     })

     const createdUser = await User.findById(user._id).select(
               "-password -refreshToken"    //- for not needed and space is for multiple object 
          )
     if (!createdUser) {
          throw new ApiError(500, "Something went wrong while registering the user")
     }

     return res
     .status(201)
     .json(
          new ApiResponse(200, createdUser, "User registered Successfully")
      )
})

const loginUser = asyncHandler( async (req, res) =>{
     // bring data from req body   (req body -> data)
     //username or email
     //find the user
     //password check 
     //access and refresh token generation
     //send cookie

     const {email, username, password} = req.body

     if (!(username || email)) {
          throw new ApiError(400, "username or email is required")      
     }

     const user = await User.findOne({
          $or: [{username}, {email}]
     })

     if (!user) {
          throw new ApiError(404,"User does not exist")
     }

     const isPasswordValid = await user.isPasswordCorrect(password)

     if (!isPasswordValid) {
          throw new ApiError(401,"Invalid user credentials")
     }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select("fullName email username avatar coverImage")//if you want to do like this or can update user directly

     const options = {          //secure as this cookie can only be modified from server 
          httpOnly: true,
          secure: true
     }

     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(                   //json response
          new ApiResponse(
                    200,{
                         user: loggedInUser, 
                         accessToken,
                         refreshToken   //here we are adding again access and refresh token 
                                        //user want to save access and refresh token
                                        //depend on what purpose you are doing this
                         
                    },
                    "User logged in Successfully"
               )
          )

})

const logoutUser = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
          req.user._id,
          {
               $unset:{
                    refreshToken: 1 //this removes the field from document
               }
          },
          {
               new: true      
          }   
          )
          const options = {          //secure as this cookie can only be modified from server 
               httpOnly: true,
               secure: true
          }

     return res
     .status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200, {}, "User logged Out"))
})
 
const refreshAccessToken = asyncHandler( async(req, res) => {
     const    incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

     if (!incomingRefreshToken) {
          throw new ApiError(401, "Unauthorized request")
     }

     try {  //just for safety purpose I have put it in try catch
          const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
     
          const user = await User.findById(decodedToken?._id)
          if (!user) {
               throw new ApiError(401, "Invalid refresh token")
          }
     
          if (incomingRefreshToken !== user?.refreshToken) {  //refreshToken is in userschema in user.model.js
               throw new ApiError(401, "Refresh token is expired or used")
          }
     
          const options = {
               httpOnly: true,
               secure: true
          }
     
          const {accessToken, newrefreshToken} = generateAccessAndRefreshTokens(user._id)
     
          return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", newrefreshToken, options)
          .json(
                    new ApiResponse(200,
                         {accessToken, refreshToken: newrefreshToken},
                         "Access token refreshed"
                    )
               )
     } catch (error) {
          throw new ApiError(401, error?.message || "Invalid refresh token")
     }
})

const changeCurrentPassword = asyncHandler( async(req,res) =>{
     const {oldPassword, newPassword} = req.body

     const user = await User.findById(req.user?._id)
     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

     if (!isPasswordCorrect) {
          throw new ApiError(401, "Invalid old Password")
     }

     user.password = newPassword
     await user.save({validateBeforeSave: false})

     return res
     .status(200)
     .json(new ApiResponse(200, {}, "Password change successfully"))
})

const getCurrentUser = asyncHandler( async(req, res) => {
     return res
     .status(200)
     .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
}) 

const updateAccountDetails = asyncHandler( async(req, res) => {
     const {fullName, email} = req.body

     if (!fullName || !email) {
          throw new ApiError(400, "All fields are required")
     }

    const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    fullName,      //or fullName: fullName
                    email,         //or email: email
               }
          },
          {new: true}   //after update information is returnd because of new:true
     ).select("-password")

     return res
     .status(200)
     .json(new ApiResponse(200, user, "Account details updated successfuly"))
})

const updateUserAvatar = asyncHandler( async(req, res) => {
     const avatarLocalPath = req.file?.path   //file for single file and files for multiple

     if (!avatarLocalPath) {
          throw new ApiError(400, "Avatar file is missing")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath)

     if (!avatar.url) {
          throw new ApiError(400, "Error while uploading on avatar")
     }

      const user = await User.findByIdAndUpdate(
               req.user?._id,
               {
                    $set: {
                         avatar: avatar.url
                    }
               },
               {new: true}
          ).select("-password")

          return res
          .status(200)
          .json(new ApiResponse(200, user, "Avatar image updated successfully"))
})

const updateUserCoverImage = asyncHandler( async(req, res) => {
     const coverImageLocalPath = req.file?.path   //file for single file and files for multiple

     if (!coverImageLocalPath) {
          throw new ApiError(400, "Cover Image file is missing")
     }

     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

     if (!coverImage.url) {
          throw new ApiError(400, "Error while uploading on cover image")
     }

      const user = await User.findByIdAndUpdate(
               req.user?._id,
               {
                    $set: {
                         coverImage: coverImage.url
                    }
               },
               {new: true}
          ).select("-password")

          return res
          .status(200)
          .json(
               new ApiResponse(200, user, "Cover image updated successfully")
          )
})

const getUserChannelProfile = asyncHandler( async(req, res) =>{
     const {username} = req.params

     if (!username?.trim()) {
          throw new ApiError(400, "username is missing")
     }
     const channel = await User.aggregate([
          {
               $match: {
                    username: username?.toLowerCase()
               }
          },
          {
               $lookup: {
                    from: "subscriptions",  // Model name is converted in lowercase and get plurals in db
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
               }
          },
          {
               $lookup: {
                    from: "subscriptions",  
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
               }
          },
          {
               $addFields: {
                    subscribersCount: {
                         $size: "$subscribers"
                    },
                    channelSubscribedToCount: {
                         $size: "$subscribedTo"
                    },
                    isSubscribed: {
                         $cond: {
                              if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                              then: true,
                              else: false 
                         }
                    }
               }
          },
          {
               $project: {
                    fullName: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelSubscribedToCount: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
               }
          }
     ])

     if (!channel?.length) {
          throw new ApiError(404, "channel does no exists")
     }

     return res
     .status(200)
     .json(
          new ApiResponse(200, channel[0], "User channel fethched successfully")
          )
})

const getWatchHistory = asyncHandler( async(req, res) => {
     //req.user._id   //we get string ' ' here not mongodb id 

     const user = await User.aggregate([
          {
               $match: {
                    _id: mongoose.Types.ObjectId.createFromTime(req.user._id)
 // new mongoose.Types.ObjectId() with the recommended mongoose.Types.ObjectId.createFromTime()
               } 
          },
          {
               $lookup: {
                    from: "videos", 
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                         {
                              $lookup: {
                                   from: "users",
                                   localField: "owner",
                                   foreignField: "_id",
                                   as: "owner",
                                   pipeline: [
                                        {
                                             $project: {
                                                  fullName: 1,
                                                  username: 1,
                                                  avatar: 1
                                             }
                                        }
                                   ]       
                              }
                         },
                         {
                              $addFields: {  
                                   owner: {
                                        $first: "$owner"
                                   }
                              }
                         }
                    ]
               }
          }
     ])

     return res
     .status(200)
     .json(
          new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully") 
          )
})


export {
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage,
     getUserChannelProfile,
     getWatchHistory
     
}