import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js"
import { ShopifyDetails } from "../models/shopifyDetails.model.js";
import axios from "axios"

export const getTotalOrders = asyncHandler(async (req, res, next) => {

})


export const getAllProducts = asyncHandler(async (req, res, next) => {
  try {
    // Check if user exists and has credentials
    if (!req.user?._id) {
      return next(new ApiError(401, "Authentication required"));
    }


    const shopify = await ShopifyDetails.findOne({ userId: req.user._id });
    console.log(shopify);

    if (!shopify) {
      return next(new ApiError(404, "Shopify credentials not found"));
    }

    const url = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/products.json`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          "X-Shopify-Access-Token": shopify.accessToken,
          "Content-Type": "application/json",
        },
        timeout: 5000 // 5 second timeout
      });

      if (!data.products) {
        return next(new ApiError(500, "Invalid response from Shopify API"));
      }

      const allVariants = data.products.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id,
          name: product.title,
          product_type: product.product_type || "Uncategorized",
          price: variant.price,
          inventory_quantity: variant.inventory_quantity || 0,
          created_at: variant.created_at,
          updated_at: variant.updated_at,
          requires_shipping: variant.requires_shipping,
          weight: variant.weight,
          weight_unit: variant.weight_unit,
        }))
      );

      return res.status(200).json(
        new ApiResponse(200, { products: allVariants }, "Products retrieved successfully")
      );
    } catch (shopifyError) {
      if (shopifyError.response?.status === 401) {
        return next(new ApiError(401, "Invalid Shopify access token"));
      }
      if (shopifyError.response?.status === 404) {
        return next(new ApiError(404, "Shopify store not found"));
      }
      return next(new ApiError(500, "Failed to fetch products from Shopify"));
    }
  } catch (error) {
    return next(new ApiError(500, "Internal server error"));
  }

});


export const getAllProductsByCategory = asyncHandler(async (req, res, next) => {
  const shopify = await ShopifyDetails.findOne({ userId: req.user._id });

  if (!shopify) return next(new ApiError(404, "Shopify Access is not provided"))

  const url = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/products.json`;

  const { data } = await axios.get(url, {
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
    new ApiResponse(201, { collections }, "shopify collection fecthed")
  )
})

export const setShopifyCred = asyncHandler(async (req, res, next) => {
  try {
    const { accessToken, shopifyShopName, apiVersion } = req.body;

    // Validate input
    if (!accessToken || !shopifyShopName || !apiVersion) {
      return next(new ApiError(400, "All credentials are required"));
    }

    // Check if user exists
    if (!req.user?._id) {
      return next(new ApiError(401, "Authentication required"));
    }

    // Check for existing credentials
    let shopify = await ShopifyDetails.findOne({ userId: req.user._id });

    // If credentials exist, update them instead of creating new ones
    if (shopify) {
      shopify = await ShopifyDetails.findOneAndUpdate(
        { userId: req.user._id },
        {
          accessToken,
          shopifyShopName,
          apiVersion
        },
        {
          new: true,
          runValidators: true
        }
      );

      return res.status(200).json(
        new ApiResponse(200, { shopify }, "Shopify credentials updated successfully")
      );
    }

    // Create new credentials if they don't exist
    const newShopify = await ShopifyDetails.create({
      accessToken,
      shopifyShopName,
      apiVersion,
      userId: req.user._id
    });

    return res.status(201).json(
      new ApiResponse(201, { shopify: newShopify }, "Shopify credentials created successfully")
    );
  } catch (error) {
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return next(new ApiError(409, "Duplicate Shopify credentials"));
    }
    return next(new ApiError(500, "Failed to save Shopify credentials"));
  }
});
export const updateShopifyCred = asyncHandler(async (req, res, next) => {
  const { accessToken, shopifyShopName, apiVersion } = req.body;

  const shopify = await ShopifyDetails.findOne({ userId: req.user._id });

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

  res.status(200).json(new ApiResponse(200, { shopify: updatedShopify }, "Shopify Details updated"))
})


