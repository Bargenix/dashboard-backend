import mongoose from 'mongoose';

const requestBargainingSchema = new mongoose.Schema(
  {
    productName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    productPrice: {
        type: String,
        required: true,
        trim: true
    },
    productId: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
      type: String,
      required: true
    },
    markAsRead: {
      type: Boolean,
      default: false
    },
    shopName: { 
        type: String, 
        required: true 
    }, 
  },{
    timestamps: true
  }
);

export const RequestBargaining = mongoose.model('bargainRequest', requestBargainingSchema);