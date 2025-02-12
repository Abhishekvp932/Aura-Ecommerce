const mongoose=require('mongoose')
mongoose.set('strictPopulate', false)
const User = require("../../models/userSchema");
const env = require("dotenv").config();
const Razorpay = require("razorpay");


const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');





const loadOrdersPage = async (req, res) => {
    try {
        const userLoged = req.session.userLoged;
        const email = req.session.userEmail;

        
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.render('userOrders', { userLoged, order: null }); 
        }
       
        const order = await Order.find({userId:user._id}).sort({createdOn:-1}).populate('orderedItems.product');
            
    //  console.log('akash kunduh',orders)
        return res.render('userOrders', {
            userLoged,
            order,
        });
    } catch (error) {
        console.error('Error loading user order page:', error);
        res.status(500).send('Server error');
    }
};

const orderSummary = async (req,res)=>{
    try {
        const userLoged = req.session.userLoged
        const id = req.params.id
        console.log('order id is',id)

      

        if(!mongoose.Types.ObjectId.isValid(id)){
          return res.status(404).redirect('/404')
        }


        const orders = await Order.findById(id).populate('orderedItems.product')
        if(!orders){
            return res.status(404).redirect('/404')
        }

        console.log(orders)

      console.log("address i",orders.address)

    const address = await Address.findOne({
      "addresses._id": orders.address,  
    });

    let selectedAddress;

    if (address) {
      selectedAddress = address.addresses.find((value) => value._id.toString() === orders.address.toString());
      console.log("Matched Address:", selectedAddress);
    } else {
      console.log("No address found");
    }
    console.log(orders)

        return res.render('orderSummary',{
            userLoged,
            orders:orders,
            address:selectedAddress,

        });
    } catch (error) {
        console.log('orderSummary page not found',error);
        res.status(500).send('server error');
    }
}
const orderCancel = async (req, res) => {
  try {
    const { id, productId } = req.params;
  
    console.log("Product ID and Order ID is", productId, id);
  
    const order = await Order.findById(id).populate("orderedItems.product");
  
    const productIndex = order.orderedItems.findIndex(
      (item) => item._id.toString() === productId
    );
  
    if (productIndex === -1) {
      return res.status(404).send("Product not found in the order");
    }
  
    const canceledProduct = order.orderedItems[productIndex];
    const productPrice = canceledProduct.product.regularPrice;
    const productQuantity = canceledProduct.quantity;
    const canceledSize = canceledProduct.size; 
  
    
    order.orderedItems[productIndex].status = "Cancelled";
  
    order.totalPrice -= productPrice * productQuantity;
  
    const product = await Products.findById(canceledProduct.product._id);
    if (product) {
      if (product.size[canceledSize] !== undefined) {
        product.size[canceledSize] += productQuantity; 
      }
      product.quantity += productQuantity; 
      await product.save();
    }
  
    
    const activeItems = order.orderedItems.filter(
      (item) => item.status !== "Cancelled"
    );
    if (activeItems.length === 0) {
      order.status = "Cancelled";
    }
  
    await order.save();
  
    res.render("cancel");
  } catch (error) {
    console.log("Order cancel error:", error);
    res.status(500).send("Server error");
  }
};

  
const returnRequest = async(req,res)=>{
  try {
    console.log('jnajinjianjnbj ')
    console.log(req.query);
    const orderId = req.query.orderId
    console.log('return id is ',orderId)
    const productId = req.query.productId
    console.log('return product id is',productId);
    const reason = req.query.reason
    console.log('reason is ',reason)
   const order = await Order.findById(orderId).populate('orderedItems')
   console.log('order data',order)
    const response = await Order.updateOne(
      {
        _id:orderId,
        'orderedItems._id':productId
      },
      {
        $set:{
          'orderedItems.$.status':'Return Request',
          'orderedItems.$.returnReason':reason
        }
      }
    )
    console.log('return uodate products',response);
    
    let change=true
    const allValues = order.orderedItems.forEach(element => {
      if(element.status != 'Request'){
        change=false
        return
      }
    });

    if(change){
      await Order.updateOne({_id:orderId},{status:'Return Request'})
    }
    
    return res.json({
      success:true,
      message:'Your Return Request Send SuccessFully',
      redirectUrl: `/orderSummary${orderId}` 
    })
  } catch (error) {

    console.log('product return error',error);
    return res.json({
      success:false,
      message:'return product error'
    })
  }
}
 


const verifyPayment = async (req, res) => {
  try {
    console.log('jnajj9ajjija9jf9ji9');
    console.log('ressponse',req.body)
    const crypto = require("crypto");
    const {payment_id, order_id, signature } = req.body;
  console.log(' razorpay_order_id', order_id)

    const generatedSignature = crypto
      .createHmac("sha256", 'QucZPITL3a19mTmRO5bvA62u')
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.json({ success: false, message: "Payment verification failed" });
    }
    

     res.json({ success: true, paymentId: payment_id, redirectUrl: "/userOrders" });
    await Cart.deleteMany();
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.json({ success: false, message: "Server error occurred" });
  }
};
module.exports = {
    loadOrdersPage, 
    orderSummary,
    orderCancel,
    returnRequest,
    verifyPayment
    
}