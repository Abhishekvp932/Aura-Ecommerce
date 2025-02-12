const { request } = require('express');
const mongoose = require('mongoose');
const { updateSearchIndex } = require('./userSchema');
const {Schema} = mongoose;

const couponSchema = new Schema({
    code:{
        type:String,
        unique:true,

    },
    createdOn:{
     type:Date,
     default:Date.now,
    },
    expireOn:{
        type:Date,
    },
    offerPrice:{
        type:Number,
    },
    minPrice:{
        type:Number,
    },
    maxPrice:{
        type:Number,
        
    },
    isList:{
        type:Boolean,
        default:true,

    },
    description:{
        type:String,
        
    },
  couponUsers:[{
    type:Schema.Types.ObjectId,
    ref:'User',
    
  }]
})

const Coupon = mongoose.model('Coupon',couponSchema)

module.exports = Coupon;