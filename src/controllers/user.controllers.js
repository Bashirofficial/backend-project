import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
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
     console.log("email: ",email);

     if (
         [fullName, email, username, password].some((field) => 
         field?.trim() == "" ) 
     ) {
          throw new ApiError(400, "All fields are required")
     }

    const existedUser =  User.findOne({
          $or: [{ username }, { email }]   //checking username or email 
     })

     if (existedUser) {
          throw new ApiError(409, "User with email or username already exists")
     }

     const avatarLocalPath = req.files?.avatar[0]?.path;  //[0] is first property and ? is optionally for checking
     const coverImagePath = req.files?.coverImage[0]?.path;

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

     const createdUser = User.findById(user._id).select(
               "-password -refreshToken"    //- for not needed and space is for multiple object 
          )
     if (!createdUser) {
          throw new ApiError(500, "Something went wrong while registering the user")
     }

     return res.status(201).json(
          new ApiResponse(200, createdUser, "User registered Successfully")
      )
})


export {registerUser}