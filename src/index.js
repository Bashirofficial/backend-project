//require('dotenv').config({path: './env' }) //It also work but for consistency in script dev dotenv/config 
// is written along with experimental json modules and then dotenv.config is written after import
//import './config';
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from './app.js'
dotenv.config({
     path: '../.env'
 });


connectDB()
.then(() => {
    app.listen(process.env.Port || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})   
.catch((err) => {
    console.log("MONGO db connectin failed !!!", err);
})












/* The above code is more polluted
import express from "express"
const app = express()

( async () => {
    try{
      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
      app.on("error", ()=> {
            console.log("ERR: ", error);
            throw error
    })

    app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${ process.env.PORT }`);
    })
    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})() 
*/