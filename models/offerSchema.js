const Category = require('./categorySchema');
const mongoose = require('mongoose');
const {Schema} = mongoose;
const offerSchema = new Schema(
  {
    category:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      
    },
    discountPercentage: {
      type: Number,
     
      min: 0,
      max: 100, 
    },
    startDate: {
      type: Date,
     
    },
    endDate: {
      type: Date,
      
    },
    isActive: {
      type: Boolean,
      default: true,  
    },
    minPrice: {
      type: Number,
     
      min: 0,  
    },
    maxPrice: {
      type: Number,
      min: 0,  
    },
    createdAt: {
      type: Date,
      default: Date.now,  
    },
    updatedAt: {
      type: Date,
      default: Date.now,  
    },
    offer:{
      type:Number,
    }
  },
  {
    timestamps: true, 
  }
);

const Offer = mongoose.model('Offer',offerSchema);
module.exports = Offer;