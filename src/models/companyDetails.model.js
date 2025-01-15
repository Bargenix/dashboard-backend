import mongoose from 'mongoose';

const companyDetailsSchema = new mongoose.Schema(
  {
    companyName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    companyWebsite: { 
        type: String, 
        match: [/^https?:\/\/.*$/, 'Invalid website URL'] 
    },
    employeeSize: { 
        type: Number, 
        min: 1 
    },
    kindsOfProducts: { 
        type: [String], 
        default: [] 
    },
    country: { 
        type: String 
    },
    state: { 
        type: String 
    },
    city: { 
        type: String 
    },
    monthlyOrderToBeHandled: { 
        type: Number, 
        min: 0 
    },
    totalInventoryProducts: { 
        type: Number, 
        min: 0 
    },
    totalCustomers: { 
        type: Number, 
        min: 0 
    },
    annualRevenue: { 
        type: Number, 
        min: 0 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, 
  },
  { timestamps: true } // Includes `createdAt` and `updatedAt`
);

module.exports = mongoose.model('CompanyDetails', companyDetailsSchema);
