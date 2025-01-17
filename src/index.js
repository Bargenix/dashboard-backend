// import 'dotenv/config'
// import connectDB from './db/index.js'
// import { app } from "./app.js"

// //Database connection
// connectDB()
// .then(() => {
//     app.on("error", (error) => {
//         console.log("ERRR :",error);
//         throw error;
//     })
//     app.listen(process.env.PORT || 8000, () => {
//         console.log(`Server is running at port ${process.env.PORT || 8000}`)
//     })
// })
// .catch((err) => {
//     console.log("MongoDB connection failed !!", err);
// })

import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1);
    }
}

export default connectDB;