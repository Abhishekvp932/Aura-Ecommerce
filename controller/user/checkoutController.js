const User = require("../../models/userSchema");
const env = require("dotenv").config();


const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require('../../models/orderSchema');
const Coupon = require('../../models/couponSchema')
const Wallet = require('../../models/walletSchema')
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require("uuid");
const { json } = require("express");



const loadCheckout = async(req,res)=>{
    try {
        const userLoged = req.session.userLoged
        const email = req.session.userEmail

        const user = await User.findOne({email:email})
        if(!user){
            req.flash('err','user not find')
            return res.redirect('/login');
        }
        const cart = await Cart.findOne({ userId: user._id }).populate('products.productId');
        const address = await Address.findOne({ userId: user._id })
        
        return res.render('checkout', {
          userLoged,
          address:address,
          cart: cart || { products: [], price: 0 }, 
          key:process.env.RAZORPAY_KEY_ID,
        });        
    } catch (error) {
        console.log('checkout page is not found',error);
        res.status(500).send('server error');
        
    }
}

const loadPaymentSuccess = async(req,res)=>{
    try {

        return res.render('payments');
    } catch (error) {
        console.log('payment success page is not working',error);
        res.status(500).send('server error');
    }
}




const razorpay = new Razorpay({
  key_id: 'rzp_test_UJHrF4ZCERjDBB',
  key_secret: 'QucZPITL3a19mTmRO5bvA62u'
});


const createRazoPayOrder = async (amount, receipt) => {
  try {
    
    return razorpay.orders.create({
      amount: amount * 100, 
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new Error("Failed to create Razorpay order");
  }
};

const placeOrder = async (req, res) => {
  try {
    const { paymentMethod, address, couponCode } = req.body;
    
    

    const email = req.session.userEmail;
    const user = await User.findOne({ email });
     
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }


  if(!paymentMethod){
    return res.json({success:false,message:'Please select a payment method'})
  }
  if(!address){
    return res.json({success:false,message:'please select a Address'})
  }

    const cart = await Cart.findOne({ userId: user._id }).populate("products.productId");

    if (!cart || cart.products.length === 0) {
      return res.json({ success: false, message: "Your cart is empty" });
    }

    let totalProducts = cart.products.length || 1;
    let discountAmount = req.session.discount || 0;
    let perProductDiscount = !isNaN(discountAmount / totalProducts)
      ? parseFloat((discountAmount / totalProducts).toFixed(2))
      : 0;

    const orderedItems = cart.products.map((product) => ({
      product: product.productId._id,
      quantity: product.quantity,
      size: product.size,
      price: product.price,
      totalPrice: parseFloat(((product.price - perProductDiscount ) * product.quantity).toFixed(2)),
      productDiscount: parseFloat((product.productDiscount + perProductDiscount).toFixed(2)),
    }));

    const totalPrice = orderedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const couponDiscount = req.session.discount || 0;
    const finalAmount = Math.max(totalPrice, 0);
    const orderId = uuidv4();

    let razorpayOrder = null;

    if (paymentMethod === "onlinePayment") {
      
      razorpayOrder = await createRazoPayOrder(finalAmount, orderId);
      

      return res.json({
        success: true,
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        key: process.env.RAZORPAY_KEY_ID,
        orderedItems,
        paymentMethod,
        totalPrice,
        couponDiscount,
         finalAmount,
         address,
         userId:user._id,
        
      });
    }
    if (paymentMethod === "walletPayment") {
      const wallet = await Wallet.findOne({ userId: user._id });

      if (!wallet || wallet.balance < finalAmount) {
        return res.json({
          success: false,
          message: "Insufficient wallet balance"
        });
      }
      wallet.balance -= finalAmount;
      await wallet.save();
      const newOrder = await Order.create({
        userId: user._id,
        orderedItems,
        paymentMethod,
        totalPrice,
        couponDiscount,
        finalAmount,
        address,
        invoiceDate: new Date(),
        status: "Pending",
        couponApplied: couponDiscount > 0
      });

      await Wallet.updateOne(
        { userId: user._id },
        { 
          $push: { 
            walletData: { 
              status: "Debit",
              price: finalAmount,
              date: new Date(),
              orderId: newOrder._id
            } 
          } 
        }
      );
    }

     if(paymentMethod === 'Cash on delivery'){
     const newOrder = await Order.create({
      userId: user._id,
      orderedItems,
      paymentMethod,
      totalPrice,
      couponDiscount,
      finalAmount,
      address,
      invoiceDate: new Date(),
      status: "Pending",
      couponApplied: couponDiscount > 0
    });
    
  }
   
    if (couponCode && couponDiscount > 0) {
      const coupon = await Coupon.findOne({ code: couponCode });

      if (coupon) {
        await Coupon.updateOne(
          { _id: coupon._id },
          { $push: { couponUsers: user._id } }
        );
      }
    }
    for (const item of orderedItems) {
      const product = await Products.findById(item.product);
      if (!product) {
        return res.json({ success: false, message: "Product not found" });
      }

      if (!product.size[item.size] || product.size[item.size] < item.quantity) {
        return res.json({
          success: false,
          message: `Insufficient stock for size ${item.size}`
        });
      }

      product.size[item.size] -= item.quantity;
      product.quantity -= item.quantity;
      await product.save();
    }

    await Cart.deleteMany({ userId: user._id });

    req.session.discount = null;

    res.json({
      success: true,
      message: "Order placed successfully",
      redirectUrl: "/userOrders"
    });

  } catch (error) {
    console.error("Error while placing order:", error);
    return res.json({ success: false, message: "Server error occurred" });
  }
};



const getAddrss = async (req,res)=>{
  try {
  const addressId = req.params.id
  const addressData = await Address.findOne({'addresses._id':addressId})

  const address = addressData.addresses.find(addr => addr._id.toString() === addressId);

  if(!address){
    return res.json({
      success:false,
      message:'address not found'
    })
  }
  res.json(address)
  } catch (error) {
    console.log('address finding error',error)
  }
}

const updateAddress = async (req,res)=>{
  try {

    const addressId = req.params.id
  const  { name, addressType, city, landMark, state, pincode, phone, altPhone } = req.body;
const email = req.session.userEmail

const user = await User.findOne({email:email})
    
  const updateAddress = await Address.updateOne({userId:user._id,'addresses._id':addressId},
    {$set:{
    'addresses.$.name':name,
    'addresses.$.addressType':addressType,
    'addresses.$.city':city,
    'addresses.$.landMark':landMark,
    'addresses.$.state':state,
    'addresses.$.pincode':pincode,
    'addresses.$.phone':phone,
    'addresses.$.altPhone':altPhone
  }},{new:true})

  return res.json({
    success:true,
    message:'Address updated successfuly'
  })

  } catch (error) {
    console.log('address updateing error',error)
    return res.json({success:false,message:'update address error'})
  }
}

module.exports = {
    loadCheckout, 
    loadPaymentSuccess,
    placeOrder,
    updateAddress,
    getAddrss,
}