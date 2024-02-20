import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({  //generaly normal cors() work but still this production level practice
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"})) //simply urlencoded() will also work
app.use(express.static("public"))
app.use(cookieParser())


export { app }