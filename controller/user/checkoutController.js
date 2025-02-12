const User = require("../../models/userSchema");
const env = require("dotenv").config();


const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require('../../models/orderSchema');
const Coupon = require('../../models/couponSchema')

const Razorpay = require('razorpay');
const { v4: uuidv4 } = require("uuid")



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
        console.log('wich address',address);
        
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
    console.log('a', amount, 'b', receipt);
    
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
    // const { address, paymentMethod, discount: rawDiscount, couponCode } = req.body;
    // console.log("Payment Method:", paymentMethod);
    // console.log("Coupon Code:", couponCode);
    // console.log("Checkout Address:", address);


const {paymentMethod,address,couponCode} =req.body
console.log('address reazo id is',address)
console.log('product order data razoa',req.body)


    if (!paymentMethod) {
      return res.json({ success: false, message: "Please select a payment method" });
    }

    const email = req.session.userEmail;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const cart = await Cart.findOne({ userId: user._id }).populate("products.productId");

    if (!cart || cart.products.length === 0) {
      return res.json({ success: false, message: "Your cart is empty" });
    }

    const orderedItems = cart.products.map((product) => ({
      product: product.productId._id,
      quantity: product.quantity,
      size: product.size,
      price: product.price,
      productDiscount:product.productDiscount
    }));

    const totalPrice = orderedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const couponDiscount =  req.session.discount || 0;
    const finalAmount = Math.max(totalPrice - couponDiscount, 0);
    const orderId = uuidv4();

    let razorpayOrder = null;

    if (paymentMethod === "onlinePayment") {
      console.log("Creating Razorpay Order:", { finalAmount, orderId });
      razorpayOrder = await createRazoPayOrder(finalAmount, orderId);
      console.log('findal amount and order id',finalAmount,orderId)
      console.log("Razorpay Order Created:", razorpayOrder);

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
        couponApplied: couponDiscount > 0,
        razorpayOrderId: razorpayOrder.id
      });
  
      return res.json({
        success: true,
        orderId:newOrder._id,
        razopayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        key: process.env.RAZORPAY_KEY_ID
      });
    }

    

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
      couponApplied: couponDiscount > 0,
    });

    console.log("New Order:", newOrder);

    if (couponCode && couponDiscount > 0) {
      const coupon = await Coupon.findOne({ code: couponCode });
      console.log("Coupon Data:", coupon);
      if (coupon) {
        coupon.couponUsers.push(user._id);
        await coupon.save();
      } else {
        console.log("Coupon not found");
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
      orderId: newOrder._id,
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
  console.log('address data',addressData)

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
    console.log('address id is',addressId)
  const  { name, addressType, city, landMark, state, pincode, phone, altPhone } = req.body;
const email = req.session.userEmail
console.log('req.body',req.body)

const user = await User.findOne({email:email})
console.log('update user id',user)
    
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

  console.log('udateed address id',updateAddress);
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