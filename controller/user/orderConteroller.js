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





const loadOrdersPage = async (req, res) => {
    try {
        const userLoged = req.session.userLoged;
        const email = req.session.userEmail;

        
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.render('userOrders', { userLoged, order: null }); 
        }
       
        const order = await Order.find({userId:user._id}).sort({createdOn:-1}).populate('orderedItems.product');
        console.log(order);
        
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

     
        const orders = await Order.findById(id).populate('orderedItems.product')

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
    const canceledSize = canceledProduct.size; // Get the ordered size
  
    
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

  
 
module.exports = {
    loadOrdersPage, 
    orderSummary,
    orderCancel,
    
}