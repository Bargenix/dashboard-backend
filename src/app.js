import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { JSONDATA_LIMIT } from "./constants.js";
import { URLDATA_LIMIT } from "./constants.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({
    origin: "*"
}))
app.use(express.json({limit: JSONDATA_LIMIT}));
app.use(express.urlencoded({extended: true, limit: URLDATA_LIMIT}));
app.use(express.static("public"));
app.use(cookieParser());

app.get("/api/v1",(req,res)=>{
    res.send("<h1>Api is working</h1>")
})

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
});

import axios from 'axios';

app.get('/auth', (req,res) => {
        const { shop } = req.query;
        console.log(shop)
    
        if (!shop) {
            console.log("first")
            return res.status(400).json({ error: "Missing shop parameter" });
        }
    
        const authUrl = `https://${shop}/admin/oauth/authorize?` +
            `client_id=${process.env.SHOPIFY_API_KEY}` +
            `&scope=${process.env.SHOPIFY_SCOPES}` +
            `&redirect_uri=${process.env.SHOPIFY_REDIRECT_URI}` +
            `&state=randomSecureString`;
        
            console.log(authUrl)
        res.redirect(authUrl);
})

app.get('/auth/callback', async (req, res) => {
    const { shop, code } = req.query;
    console.log("code",code)
    if (!shop || !code) {
        return res.status(400).json({ error: "Missing shop or code parameter" });
    }

    try {
        const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            code: code
        });

        const accessToken = response.data.access_token;
        console.log("Access Token:", accessToken);

        // // Store access token in DB (Example)
        // await saveShopCredentials(shop, accessToken);

        res.json({ success: true, message: "App installed successfully", accessToken });
    } catch (error) {
        console.error("Error getting access token:", error);
        res.status(500).json({ error: "Failed to get access token" });
    }
});

//Routes
import userRouter from "./routes/user.route.js"
import shopifyRouter from "./routes/shopify.route.js"
import bargainingRouter from "./routes/bargaining.route.js"
import companyRouter from "./routes/company.route.js"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/shopify", shopifyRouter);
app.use("/api/v1/bargaining", bargainingRouter);

app.use(errorMiddleware);

export { app };