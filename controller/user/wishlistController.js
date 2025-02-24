const User = require("../../models/userSchema");
const env = require("dotenv").config();

const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose')
const Wishlist = require('../../models/wishlistSchema')



const loadWishlist = async(req,res)=>{
    try {
        const userLoged = req.session.userLoged
        const email = req.session.userEmail
        const user = await User.findOne({email:email})
       if(!user){
       req.flash('err','user not found')
       return res.redirect('/login')
       }
        const wishlist = await Wishlist.findOne({ userId:user._id }).populate('products.productId')

        if(wishlist && wishlist.products){
            wishlist.products.forEach((item)=>{
                console.log('wish list quantity',item)
            })
        }else{
            console.log('wishlist empty')
        }
        
        if(!wishlist){
            return res.render('wishlist',{
                userLoged,
                wishlist:[],
                wishlistId:null,
            })
        }
        if(!wishlist || wishlist.products.length===0){
            return res.render('wishlist',{
                userLoged,
                wishlist:[],
                wishlistId:wishlist._id,
            })
        }

        return res.render('wishlist',{
            userLoged,
            wishlist:wishlist.products,
            wishlistId:wishlist._id
        })
    } catch (error) {
        console.log('wishlist page not found')
        res.status(500).send('server error')
    }
}

const addToWishlist = async(req,res)=>{
    try {
       let {productId} = req.body
        productId = productId.trim();
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid Product ID" });
          }
        const email = req.session.userEmail;
       const user = await User.findOne({email:email})

       if(!user){
        req.flash('err','user not found')
        return res.redirect('/login')
       }
       

       let wishlist = await Wishlist.findOne({userId:user._id})
       if(!wishlist){
        wishlist = new Wishlist({userId:user._id,products:[]})
       }
      const existingProduct = wishlist.products.find((item)=> item.productId.toString()===productId);
      if(existingProduct){
        return res.json({
            success:false,
            message:'Product Already in Wishlist'
        })
      }

       wishlist.products.push({
        productId: new mongoose.Types.ObjectId(productId)
        
       })
        await wishlist.save()
       return res.json({
        success:true,
        message:'Product addedd To Wishlist',
      
       })
        
    } catch (error) {
        console.log('wishlist adding error',error)
          return res.json({
            success:false,
            message:'product adding error'
          })
    }
}

const addToCart = async(req,res)=>{
    try {
        const {productId} = req.body
        const email = req.session.userEmail
        const user = await User.findOne({email:email})
        if(!user){
            req.flash('err','user not found')
            return res.redirect('/login')
        }
        const product = await Products.findById(productId)
    
   const availableSize = Object.keys(product.size).filter((size)=>  product.size[size]>0);

   if(availableSize.length ===0){
    return res.json({
        success:false,
        message:'No available in stock'
    })
   }
   const randomSize = availableSize[Math.floor(Math.random() * availableSize.length)];

        let cart = await Cart.findOne({userId:user._id})

        if(!cart){
            cart = new Cart({userId:user._id,products:[]})
        }

        const existingProduct = cart.products.find(
            (item) => item.productId.toString() === productId && item.size === randomSize
        );

        let categoryOffer = 0;  
        const offersList = await offers.find({ category: product.category });
        
        
        if (offersList.length > 0) { 
          for (const offer of offersList) {  
            if (
              product.regularPrice > offer.minPrice &&
              product.regularPrice < offer.maxPrice &&
              offer.isActive 
            ) {
              categoryOffer = product.regularPrice - ((product.regularPrice * offer.offer) / 100)-product.productOffer
              break; 
            }
          }
        }
    

        if (existingProduct) {
            return res.json({
                success: false,
                message: "Product is already in the cart!",
            });
        }
        cart.products.push({
            productId:productId,
            name:product.productName,
            quantity:1,
            price:categoryOffer || product.regularPrice - product.productOffer,
            totalPrice:categoryOffer || product.regularPrice - product.productOffer,
            size:randomSize,
            productDiscount:product.productOffer,            
           })
           
           cart.totalCartPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0);
           await cart.save()

           return res.json({
            success:true,
            message:'Product added successfuly'
           })

    } catch (error) {
        console.log('wishlist product add to car error',error)
        return res.json({
            success:false,
            message:'wishlist product add to car error'
        })
    }
}


const removeWishlist = async(req,res)=>{
    try {
       const {id,productId} = req.params

       const updatedData = await Wishlist.updateOne(
        {_id:id},
        {$pull:{products:{_id:productId}}}
       )
       console.log('product removed success fully');
       res.redirect('/wishlist')
        
    } catch (error) {
        console.log('wishlist product removed success fully');
        res.status(500).send('server error');
        
    }
}

module.exports = {
    loadWishlist,
    addToWishlist,
    addToCart,
    removeWishlist
}

