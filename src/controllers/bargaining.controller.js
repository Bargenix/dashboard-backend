import { BARGAIN_BEHAVIOUR } from "../constants.js";
import { BargainingDetails } from "../models/bargainingDetails.model.js";
import { RequestBargaining } from "../models/requestBargaining.model.js";
import { ShopifyDetails } from "../models/shopifyDetails.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import axios from "axios"

// export const deactivateAllProducts = asyncHandler(async (req, res, next) => {
//   const { reason } = req.body;

//   if (!reason) {
//     return next(new ApiError(400, "Please provide reason"));
//   }

//   const shopify = await ShopifyDetails.findOne({ userId: req.user._id });
//   if (!shopify) return next(new ApiError(404, "Shopify Access is not provided"));

//   await BargainingDetails.updateMany(
//     { userId: req.user._id },
//     {
//       $set: {
//         isActive: false,
//         deactivationReason: reason,
//         deactivatedAt: new Date(),
//         minPrice: 0
//       }
//     }
//   );

//   res.status(200).json(
//     new ApiResponse(200, { message: "All products deactivated successfully" })
//   );
// });

export const deactivateAllProducts = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new ApiError(400, "Please provide a reason"));
  }

  try {
    const updateResult = await BargainingDetails.updateMany(
      {}, // Remove user-based filtering
      {
        $set: {
          isActive: false,
          deactivationReason: reason,
          deactivatedAt: new Date(),
          minPrice: 0
        }
      }
    );

    res.status(200).json(
      new ApiResponse(200, { modifiedCount: updateResult.modifiedCount }, "All products deactivated successfully")
    );
  } catch (error) {
    return next(new ApiError(500, "Failed to deactivate products"));
  }
});


export const deactivateByCategory = asyncHandler(async (req, res, next) => {
  const { category, reason } = req.body;

  if (!category || !reason) {
    return next(new ApiError(400, "Please provide category and reason"));
  }

  const shopify = await ShopifyDetails.findOne({ userId: req.user._id });
  if (!shopify) return next(new ApiError(404, "Shopify Access is not provided"));

  try {
    // First, get the collection ID for the category title
    const collectionsUrl = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/custom_collections.json`;
    const collectionsResponse = await axios.get(collectionsUrl, {
      headers: {
        "X-Shopify-Access-Token": shopify.accessToken,
        "Content-Type": "application/json",
      },
    });

    const targetCollection = collectionsResponse.data.custom_collections.find(
      collection => collection.title === category
    );

    if (!targetCollection) {
      return next(new ApiError(404, `Category not found: ${category}`));
    }

    // Get all products in this collection
    const collectionProductsUrl = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/collections/${targetCollection.id}/products.json`;
    const { data } = await axios.get(collectionProductsUrl, {
      headers: {
        "X-Shopify-Access-Token": shopify.accessToken,
        "Content-Type": "application/json",
      },
    });

    const productVariantIds = data.products.flatMap(product =>
      product.variants.map(variant => variant.id)
    );

    if (productVariantIds.length === 0) {
      return next(new ApiError(404, `No products found in category: ${category}`));
    }

    // Update bargaining details for all products in the category
    await BargainingDetails.updateMany(
      {
        productId: { $in: productVariantIds },
        userId: req.user._id
      },
      {
        $set: {
          isActive: false,
          deactivationReason: reason,
          deactivatedAt: new Date(),
          minPrice: 0
        }
      }
    );

    res.status(200).json(
      new ApiResponse(200, { message: "Category products deactivated successfully" })
    );
  } catch (error) {
    console.error("Shopify API Error:", error.response?.data || error.message);
    return next(new ApiError(500, "Failed to process category deactivation"));
  }
});


export const setBargainingByCategory = asyncHandler(async (req, res, next) => {
  const { category, behavior, minPrice } = req.body;

  // Validate input fields
  if (!category || !behavior || minPrice === undefined) {
    return next(new ApiError(400, "Please provide category, behavior, and minPrice"));
  }

  const shopify = await ShopifyDetails.findOne({ userId: req.user._id });
  if (!shopify) return next(new ApiError(404, "Shopify Access is not provided"));

  // Fetch products from Shopify
  const url = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/products.json`;
  const { data } = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": shopify.accessToken,
      "Content-Type": "application/json",
    },
  });

  // Filter products by category
  const categoryProducts = data.products.filter(
    (product) => (product.product_type || "Uncategorized") === category
  );

  if (categoryProducts.length === 0) {
    return next(new ApiError(404, `No products found in the category: ${category}`));
  }

  // Update or create bargaining details for each product variant in the category
  for (const product of categoryProducts) {
    for (const variant of product.variants) {
      const existingBargainingDetail = await BargainingDetails.findOne({
        productId: variant.id,
        userId: req.user._id,
      });

      if (existingBargainingDetail) {
        // Update existing bargaining detail
        existingBargainingDetail.behavior = behavior;
        existingBargainingDetail.minPrice = minPrice;
        await existingBargainingDetail.save();
      } else {
        // Create a new bargaining detail
        await BargainingDetails.create({
          productId: variant.id,
          behavior,
          minPrice,
          userId: req.user._id,
        });
      }
    }
  }

  res.status(201).json(
    new ApiResponse(201, { message: "Bargaining details updated successfully" })
  );
});

export const setBargainingToAllProducts = asyncHandler(async (req, res, next) => {
  const { behavior, minPrice } = req.body;

  // Validate input fields
  if (!behavior || minPrice === undefined) {
    return next(new ApiError(400, "Please provide behavior and minPrice"));
  }

  // Validate behavior
  if (!BARGAIN_BEHAVIOUR.includes(behavior)) {
    return next(new ApiError(400, "Invalid behavior provided"));
  }

  // Find Shopify access details for the authenticated user
  const shopify = await ShopifyDetails.findOne({ userId: req.user._id });
  if (!shopify) return next(new ApiError(404, "Shopify Access is not provided"));

  // Fetch products from Shopify
  const url = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/products.json`;
  const { data } = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": shopify.accessToken,
      "Content-Type": "application/json",
    },
  });

  const products = data.products;

  if (products.length === 0) {
    return next(new ApiError(404, "No products found in the Shopify store"));
  }

  // Process all products and their variants
  for (const product of products) {
    for (const variant of product.variants) {
      const existingBargainingDetail = await BargainingDetails.findOne({
        productId: variant.id,
        userId: req.user._id,
      });

      if (existingBargainingDetail) {
        // Update existing bargaining detail
        existingBargainingDetail.behavior = behavior;
        existingBargainingDetail.minPrice = minPrice;
        await existingBargainingDetail.save();
      } else {
        // Create a new bargaining detail
        await BargainingDetails.create({
          productId: variant.id,
          behavior,
          minPrice,
          userId: req.user._id,
        });
      }
    }
  }

  res.status(201).json(
    new ApiResponse(201, { message: "Bargaining details set for all products successfully" })
  );
})

export const setBargainingByProduct = asyncHandler(async (req, res, next) => {
  const { productId, behavior, minPrice } = req.body;

  // Validate input fields
  if (!productId || minPrice === undefined) {
    return next(new ApiError(400, "Please provide productId, behavior, and minPrice"));
  }

  // if (!BARGAIN_BEHAVIOUR.includes(behavior)) {
  //   return next(new ApiError(400, `Invalid behavior. Valid options are: ${validBehaviors.join(", ")}`));
  // }

  // Fetch Shopify credentials for the user
  const shopify = await ShopifyDetails.findOne({ userId: req.user._id });
  if (!shopify) {
    return next(new ApiError(404, "Shopify Access is not provided"));
  }

  const url = `https://${shopify.shopifyShopName}.myshopify.com/admin/api/${shopify.apiVersion}/products.json`;

  try {
    // Fetch all products from Shopify
    const { data } = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": shopify.accessToken,
        "Content-Type": "application/json",
      },
    });

    // Flatten all product variants into a single array, including product_type
    const allVariants = data.products.flatMap((product) =>
      product.variants.map((variant) => ({
        productId: product.id,
        variantId: variant.id,
        productType: product.product_type || "Uncategorized",
        productTitle: product.title,
        variantTitle: variant.title,
        price: variant.price,
        inventory_quantity: variant.inventory_quantity || 0,
      }))
    );

    // Check if the provided productId matches any variant
    const targetVariant = allVariants.find((variant) => variant.variantId.toString() === productId);
    if (!targetVariant) {
      return next(new ApiError(404, "Product variant not found"));
    }

    // Check if a bargaining record already exists for this product variant
    let bargainingRecord = await BargainingDetails.findOne({
      productId: targetVariant.variantId,
      userId: req.user._id,
    });

    if (bargainingRecord) {
      // Update existing record
      // bargainingRecord.behavior = behavior;
      bargainingRecord.minPrice = minPrice;
      await bargainingRecord.save();
    } else {
      // Create a new bargaining record
      bargainingRecord = new BargainingDetails({
        productId: targetVariant.variantId,
        // behavior,
        minPrice,
        userId: req.user._id,
      });
      await bargainingRecord.save();
    }

    // Return success response
    res.status(201).json(
      new ApiResponse(
        201,
        {
          productId: targetVariant.variantId,
          minPrice,
        },
        "Bargaining details successfully set"
      )
    );
  } catch (error) {
    return next(new ApiError(500, `Error fetching or processing data: ${error.message}`));
  }
});


export const setMinPrice = asyncHandler(async (req, res, next) => {
  const { productId, minPrice } = req.body;

  // Validate input fields
  if (!productId || minPrice === undefined) {
    return next(new ApiError(400, "Please provide productId and minPrice"));
  }

  // Validate minPrice is a positive number
  if (isNaN(minPrice) || minPrice < 0) {
    return next(new ApiError(400, "Minimum price must be a positive number"));
  }

  try {
    // Find and update the bargaining detail
    const updatedBargainingDetail = await BargainingDetails.findOneAndUpdate(
      { productId: productId },
      {
        $set: {
          minPrice: minPrice,
          isActive: true  // Set active when min price is set
        }
      },
      { new: true }
    );

    if (!updatedBargainingDetail) {
      return next(new ApiError(404, "No bargaining details found for this product"));
    }

    // Return success response
    res.status(200).json(
      new ApiResponse(
        200,
        {
          productId,
          minPrice: updatedBargainingDetail.minPrice,
          behavior: updatedBargainingDetail.behavior,
          isActive: updatedBargainingDetail.isActive,
          isAvailable: updatedBargainingDetail.isAvailable
        },
        "Minimum price updated successfully"
      )
    );
  } catch (error) {
    return next(new ApiError(500, `Error updating minimum price: ${error.message}`));
  }
});

// Add delete controller
export const deleteBargaining = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  if (!productId) {
    return next(new ApiError(400, "Please provide productId"));
  }

  try {
    // Find and update
    const bargainingDetail = await BargainingDetails.findOneAndUpdate(
      { productId: productId },
      { $set: { isActive: false, minPrice: 0 } }, // Update minPrice to 0
      { new: true }
    );

    if (!bargainingDetail) {
      return next(new ApiError(404, "No bargaining details found for this product"));
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          productId,
          isActive: bargainingDetail.isActive,
          minPrice: bargainingDetail.minPrice
        },
        "Bargaining detail marked as inactive and minPrice set to 0 successfully"
      )
    );
  } catch (error) {
    return next(new ApiError(500, `Error deactivating bargaining detail: ${error.message}`));
  }
});

export const getBargainingDetails = async (req, res) => {
  try {
    const bargainingDetails = await BargainingDetails.find({}, 'productId minPrice behavior isAvailable isActive');

    res.status(200).json({
      success: true,
      data: bargainingDetails
    });
  } catch (error) {
    console.error("Error fetching bargaining details:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

export const setBulkMinPrice = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates)) {
    throw new ApiError(400, "Invalid updates data");
  }

  const bulkOps = updates.map(update => ({
    updateOne: {
      filter: {
        productId: update.productId,
        userId: req.user._id
      },
      update: {
        $set: {
          minPrice: update.minPrice,
          isActive: true
        }
      },
      upsert: true
    }
  }));

  await BargainingDetails.bulkWrite(bulkOps);

  res.status(200).json(
    new ApiResponse(200, { message: `Updated ${updates.length} products successfully` })
  );
});

export const sendProductData = asyncHandler(async (req, res) => {
  let payload = req.body;
  const shopifyCreds = await ShopifyDetails.findOne({"shopifyShopName" : payload.shopName})
  
  payload = {...payload,accessToken : shopifyCreds.accessToken, shopifyShopName : shopifyCreds.shopifyShopName, apiVersion : shopifyCreds.apiVersion}
  console.log("Received payload:", payload);

    try {

        const response = await fetch('https://7cc1-103-200-80-228.ngrok-free.app/api/shopify-request/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        console.log('Bargain data stored successfully:', responseData);
        
        // Respond to client with success
        const allDetails = {...responseData,...shopifyCreds}
        res.json({ receivedData: allDetails});

    } catch (error) {
        console.error('Error storing bargain data:', error);

        // Send error response
        res.status(500).json({ error: 'Failed to send data' });
    }
});

export const requestForBargain = asyncHandler(async (req,res,next) => {
  const { productTitle, variantPrice, customerEmail, shopName, variantTitle, variantId } = req.body;

  if (!productTitle || !variantPrice || !customerEmail || !shopName || !variantTitle) {
    res.status(400);
    throw new Error('All fields are required');
  }

  // If variantTitle starts with "Default Title", replace it with productTitle
  const finalVariantTitle = variantTitle.startsWith('Default Title') ? productTitle : variantTitle;

  try {
    const newBargainRequest = await RequestBargaining.create({
      productName: finalVariantTitle,
      productId: variantId,
      productPrice: variantPrice,
      customerEmail,
      shopName
    });

    res.status(201).json({
      success: true,
      message: 'Bargain request submitted successfully',
      data: newBargainRequest,
    });
  } catch (error) {
    res.status(500);
    throw new Error('Internal Server Error');
  }
})

export const getBargainInfo = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let product = {};

  product = await BargainingDetails.findOne({productId: id})

  res.status(200).json(
    new ApiResponse(200,{product},"Product avaiable to bargain")
  )
})

export const getBargainRequestsByShop = asyncHandler(async (req, res, next) => {

  if (!shopName) {
    res.status(400);
    throw new Error('Shop name is required');
  }

  try {
    const bargainRequests = await RequestBargaining.find({ shopName, markAsRead: false });
    res.status(200).json({
      success: true,
      data: bargainRequests,
    });
  } catch (error) {
    res.status(500);
    throw new Error('Internal Server Error');
  }
});

export const markAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error('Request ID is required');
  }

  try {
    const updatedRequest = await RequestBargaining.findByIdAndUpdate(
      id,
      { markAsRead: true },
      { new: true }
    );

    if (!updatedRequest) {
      res.status(404);
      throw new Error('Bargain request not found');
    }

    res.status(200).json({
      success: true,
      message: 'Bargain request marked as read',
      data: updatedRequest,
    });
  } catch (error) {
    res.status(500);
    throw new Error('Internal Server Error');
  }
});