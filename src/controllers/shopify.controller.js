import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {ApiResponse} from "../utils/apiResponse.js"
import { ShopifyDetails } from "../models/shopifyDetails.model.js";
import axios from "axios"

export const getTotalOrders = asyncHandler(async(req,res,next) => {

})

export const getAllProducts = asyncHandler(async (req, res, next) => {
    const shopify = await ShopifyDetails.findOne({ userId: req.user._id });
  
    if (!shopify) return next(new ApiError(404, "Shopify Access is not provided"));
  
    const url = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/products.json`;
  
    const { data } = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": shopify.accessToken,
        "Content-Type": "application/json",
      },
    });
  
    // Flatten all product variants into a single array, including product_type
    const allVariants = data.products.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        name: product.title, // Use product title as the name for the variant
        product_type: product.product_type || "Uncategorized", // Include product type
        price: variant.price,
        inventory_quantity: variant.inventory_quantity || 0,
        created_at: variant.created_at,
        updated_at: variant.updated_at,
        requires_shipping: variant.requires_shipping,
        weight: variant.weight,
        weight_unit: variant.weight_unit,
      }))
    );
  
    res.status(200).json(
        new ApiResponse(200, {products: allVariants} , "All Products retrived successfully")
    );
  });
  
  

export const getAllProductsByCategory = asyncHandler(async(req,res,next) => {
    const shopify = await ShopifyDetails.findOne({userId: req.user._id});

    if(!shopify) return next(new ApiError(404, "Shopify Access is not provided"))

    const url = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/products.json`;

    const {data} = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": shopify.accessToken,
        "Content-Type": "application/json",
      },
    });

    const collections = {};

    data.products.forEach((product) => {
      const productType = product.product_type || "Uncategorized";
  
      if (!collections[productType]) {
        collections[productType] = [];
      }
  
      // Collect variant details: price and inventory for each variant
      const variantsDetails = product.variants.map((variant) => ({
        id: variant.id,
        name: product.title, // Use product title as the name for the variant
        price: variant.price,
        inventory_quantity: variant.inventory_quantity || 0,
        created_at: variant.created_at,
        updated_at: variant.updated_at,
        requires_shipping: variant.requires_shipping,
        weight: variant.weight,
        weight_unit: variant.weight_unit,
      }));
  
      // Flatten and collect all variants
      collections[productType].push(...variantsDetails);
    });

    res.status(201).json(
        new ApiResponse(201, {collections}, "shopify collection fecthed")
    )
})

export const setShopifyCred = asyncHandler(async(req,res,next) => {
    const {accessToken, shopifyShopName, apiVersion} = req.body;

    if(!accessToken || !shopifyShopName || !apiVersion) return next(new ApiError(404, "Fill all the credentals"));

    const shopify = await ShopifyDetails.findOne({userId: req.user._id})

    if(shopify) return next(new ApiError(404, "Shopify Credential already added"))

    const newShopify = await ShopifyDetails.create({
        accessToken,
        shopifyShopName,
        apiVersion,
        userId: req.user._id
    })

    res.status(201).json(
        new ApiResponse(201, {shopify: newShopify}, "shopify details created")
    )
})

export const updateShopifyCred = asyncHandler(async(req,res,next) => {
    const { accessToken, shopifyShopName, apiVersion } = req.body;

    const shopify = await ShopifyDetails.findOne({userId: req.user._id});

    if (!shopify) {
        return next(new ApiError(400, "Shopify doesn't exist"));
    } 

    const updatedShopify = await ShopifyDetails.findByIdAndUpdate(
        shopify._id,
        {
            accessToken: accessToken || shopify.accessToken,
            shopifyShopName: shopifyShopName || shopify.shopifyShopName,
            apiVersion: apiVersion || shopify.apiVersion
        },
        {
            new: true,
            runValidators: true
        }
    )

    if (!updatedShopify) return next(new ApiError(400, "Shopify Details not updated"))

    res.status(200).json(new ApiResponse(200, { shopify: updatedShopify}, "Shopify Details updated"))
})


