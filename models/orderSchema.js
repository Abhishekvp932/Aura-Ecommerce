const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: uuidv4, 
        unique: true,
    },
    orderedItems: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          price: {
            type: Number,
            default: 0,
          },
          status: {
            type: String,
            enum: ["Ordered", "Cancelled",'Return Request','Returned','Return Denied'],
            default:'Ordered'
          },
          size:{
            type:String
          },
          returnReason:{
            type:String,
            default:'none',
            required:false,
          },
          productDiscount:{
            type:Number
          },
          totalPrice:{
            type:Number,
            default: 0,
          },
          productOffer:{
          
          }
        },
       
      ],
    totalPrice: {
        type: Number,
        required: true,
    },
    couponDiscount: {
        type: Number,
        default: 0,
    },
    finalAmount: {
        type: Number,
       
    },
    address: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
      
    },
    invoiceDate: {
        type: Date,
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Returned','Pending Payment','Return Denied'],
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true,
    },
    couponApplied: {
        type: Boolean,
        default: false,
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    paymentMethod:{
        type:String
        
    },
      
    
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
