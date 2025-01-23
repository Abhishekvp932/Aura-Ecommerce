const User = require("../../models/userSchema");
const env = require("dotenv").config();


const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require('../../models/orderSchema');


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
        const address = await Address.find({ userId: user._id });
        
        return res.render('checkout', {
          userLoged,
          address:address,
          cart: cart || { products: [], price: 0 }, 
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
const placeOrder = async (req, res) => {
    try {
      const { address, paymentMethod, discount: rawDiscount } = req.body;
    console.log('order data',req.body);
      const email = req.session.userEmail;
      const user = await User.findOne({ email:email});
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/checkout');
      }
  
      const selectedAddress = await Address.findOne({userId:user._id});
      if (!selectedAddress) {
        req.flash('error', 'Invalid address selected');
        return res.redirect('/checkout');
      }
  
      const cart = await Cart.findOne({ userId: user._id }).populate('products.productId');
      if (!cart || cart.products.length === 0) {
        req.flash('error', 'Your cart is empty');
        return res.redirect('/checkout');
      }
  
      const orderedItems = cart.products.map((product) => ({
        product: product.productId._id,
        quantity: product.quantity,
        price: product.price,
      }));
  
      const totalPrice = orderedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const discount = parseFloat(rawDiscount) || 0;
      const finalAmount = totalPrice - discount;
  
      const newOrder = {
        orderedItems,
        totalPrice,
        discount,
        finalAmount,
        address: selectedAddress._id,
        invoiceDate: new Date(),
        status: 'Pending',
        couponApplied: discount > 0,
      };
    console.log(newOrder);

      await Order.create(newOrder);
      await Cart.deleteMany();
      console.log('Order placed:', newOrder);
  
      return res.redirect('/payments');
    } catch (error) {
      console.error('Error while placing order:', error);
      res.status(500).send('Server error');
    }
  };
  
module.exports = {
    loadCheckout, 
    loadPaymentSuccess,
    placeOrder,
}