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





const loadOrdersPage = async (req,res)=>{
    try {
        const userLoged = req.session.userLoged

        const order = await Order.find().populate('orderedItems.product');

        console.log(order);
        
        return res.render('userOrders',{userLoged,order})
    } catch (error) {
        console.log('user order page not found',error);
        res.status(500).send('server error');
    }
}


module.exports = {
    loadOrdersPage, 
}