const mongoose=require('mongoose')
mongoose.set('strictPopulate', false)

const User = require("../../models/userSchema");
const env = require("dotenv").config();


const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema')


const couponApply = async(req,res)=>{
    try {
       const {couponCode,totalAmount} = req.body
console.log('coupon code is ',couponCode)
       const email = req.session.userEmail
       const user = await User.findOne({email:email})
console.log('1')
       console.log('total amount is',totalAmount)
       const a=couponCode.trim()
       const coupon = await Coupon.findOne({code:a})
console.log('coupon data is',coupon)
      
       if(!coupon){
        return res.json({
            success:false,
            message:'Invalid Coupon code'
        })
       }


     let discount = coupon.offerPrice
     let newTotal = Math.max(totalAmount - discount,0)
     req.session.discount = discount
     console.log('new total is',newTotal)
     const cart = await Cart.findOne({userId:user._id}).populate('products')
     console.log('cartp products is',cart.products)
     console.log('4')

       if(coupon.couponUsers.includes(user._id)){
        return res.json({
            success:false,
            message:'this user already applyied this coupon'
        })
       }

     const value = cart.products.some(item => {
        if (item.totalPrice < coupon.minPrice || item.totalPrice > coupon.maxPrice) {
            return true;
        }
    });
console.log('5')

    if (value) {
        return res.json({
            success: false,
            message: `Coupon is only valid for orders between ₹${coupon.minPrice} and ₹${coupon.maxPrice}`
        });
    }

    // const couponData = await Order.findOne({userId:user._id},{couponDiscount:discount})

        return res.json({success:true,
        newTotal:newTotal.toFixed(2),
        message:'Coupon applyied success fully'
      })
console.log('6')
          
    } catch (error) {
        console.log('coupon applying error',error)
        res.status(500).send('server error');
    }
}


const findAllCoupon = async(req,res)=>{
    try {
        console.log('finding all coupons')

        const coupon = await Coupon.find()
        return res.json({success:true,coupon})
    } catch (error) {
        console.log('coupon finding error',error);
        
    }
}

module.exports ={
    couponApply,
    findAllCoupon
}