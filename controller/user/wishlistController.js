const User = require("../../models/userSchema");
const env = require("dotenv").config();

const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");

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
        const {productId} = req.body
        console.log('product id is nnn',productId)
        const email = req.session.userEmail;
       const user = await User.findOne({email:email})
        console.log('user is ',user) 


       if(!user){
        req.flash('err','user not found')
        return res.redirect('/login')
       }
       console.log('1');
       

       let wishlist = await Wishlist.findOne({userId:user._id})
       console.log('2');
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
        productId:productId,
        
       })
        await wishlist.save()
       console.log('3')
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
        console.log('product id is',productId)
        const email = req.session.userEmail
        const user = await User.findOne({email:email})
        if(!user){
            req.flash('err','user not found')
            return res.redirect('/login')
        }
        const product = await Products.findById(productId)
    
        console.log('product data is ',product)
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
            price:product.regularPrice-product.productOffer,
            size:randomSize
            
           })
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
       console.log(req.params)

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

