const mongoose = require('mongoose')
const {Schema} = mongoose

const cartSchema = new Schema ({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        
    },
    totalCartPrice:{
  type:Number,
    },
    products:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            
        },
        name:{
              type:String
        },
        quantity:{
            type:Number,
        },
        price:{
            type:Number,
           
        },
        totalPrice:{
            type:Number,
           
        },
        status:{
            type:String,
            default:'placed'
        },  
        cancellationReason:{
             type:String,
             default:"none"
        },
        size:{
            type:String
        },
        productDiscount:{
            type:Number
          }
    }]
})

const Cart = mongoose.model('Cart',cartSchema)

module.exports = Cart;