import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,           
            trim: true,
            index: true
        },
        avatar: {
            type: String,  //cloudnary url
            required: true
        },
        coverImage: {
            type: String //cloudnary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    
    },{timestamps: true}
)

userSchema.pre("save", async function (next) {           //prehooks //dont use arrow function here 
   if(!this.isModified("password"))  return next(); //if not modifed then return next;

    this.password = bcrypt.hash(this.password, 10)
    next()

})      

userSchema.methods.isPasswordCorrect = async function
(password){
   return await bcrypt.compare(password, this.password)  //this.password is encrypted which is compare with user pwd
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
        
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)
