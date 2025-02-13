import mongoose from 'mongoose';

const shopifyDetailsSchema = new mongoose.Schema(
  {
    accessToken: { 
        type: String, 
        required: true, 
        trim: true 
    },
    shopifyShopName: {
        type: String,
        required: true,
        trim: true
    },
    apiVersion: {
      type: String,
      required: true
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, 
  }
);

export const ShopifyDetails = mongoose.model('shopifyDetails', shopifyDetailsSchema);