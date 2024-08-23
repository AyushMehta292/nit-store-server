import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

//Just for testing
import { sendRegMail } from "./mailer/sendRegOtp.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(cookieParser())

app.get("/", (req, res) => {
    sendRegMail("ayushmehta292@gmail.com", "Ayush", "1234");        //Just for testing
    res.send("Hello World")
})

//routes import
import userRouter from "./routes/user.router.js"
// import productRouter from "./routes/product.router.js"
// import reviewRouter from "./routes/review.router.js"


//routes declaration
app.use("/api/v1/users", userRouter)


export { app }