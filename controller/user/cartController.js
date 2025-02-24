const User = require("../../models/userSchema");
const env = require("dotenv").config();

const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Offer = require("../../models/offerSchema");

const loadCart = async (req, res) => {
  try {
    const userLoged = req.session.userLoged;
    const email = req.session.userEmail;
    const user = await User.findOne({ email: email });
    if (!user) {
      req.flash("err", "User not found");
      return res.redirect("/login");
    }

    const cart = await Cart.findOne({ userId: user._id }).populate("products.productId");

    if (cart && cart.products) { 
        cart.products.forEach((item) => {
            console.log('quantity', item.quantity);  
        });
    } else {
        console.log("Cart not found or empty.");
    }

    if (!cart || cart.products.length === 0) {
      return res.render("cart", {
        userLoged,
        cart: [],
        cartId: cart?._id || null,
        totalPrice: 0,
        msg:req.flash('err')
      });
    }

    // const totalPrice = cart.products.reduce((total, item) => {
    //   if (item.productId) {
    //     return total + item.productId.regularPrice * item.quantity;
    //   }
    //   return total;
    // }, 0);
const cartItem = await User.findOne({email:email}).populate('carts.products');



    return res.render("cart", {
      userLoged,
      cart: cart.products,
      cartId: cart._id,
      msg:req.flash('err')
      
    });
   
  } catch (error) {
    console.log("Cart page error:", error);
    res.status(500).send("Server error");
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = parseInt(req.body.quantity);
    
    const size = req.body.size;
    const email = req.session.userEmail;

    const product = await Products.findById(productId);
    if (!product) {
      req.flash('err', 'Product not found');
      return res.redirect(`/product-details/${productId}`);
    }

    
    if (!product.size[size]) {
      req.flash('err', 'Invalid size selected');
      return res.redirect(`/product-details/${productId}`);
    }

    if (quantity > product.size[size]) {
      req.flash('err', 'Not enough stock available for the selected size');
      return res.redirect(`/product-details/${productId}`);
    }

 
    const user = await User.findOne({ email: email });
    if (!user) {
      req.flash('err', 'User not found');
      return res.redirect('/login');
    }

    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      cart = new Cart({ userId: user._id, products: [] });
    }

   
    if (quantity > 5) {
      req.flash('err', 'You can only add a maximum of 5 items to your cart');
      return res.redirect(`/product-details/${productId}`);
    }

   
    const existingProduct = cart.products.find(
      (item) => item.productId.toString() === productId && item.size === size
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
      const updatedQuantity = existingProduct.quantity + quantity;
      if (updatedQuantity > product.size[size]) {
        req.flash('err', 'Not enough stock available for this size');
        return res.redirect(`/product-details/${productId}`);
      }

      existingProduct.quantity = updatedQuantity;
      existingProduct.totalPrice = existingProduct.price * existingProduct.quantity - product.productOffer -req.session.discount
    } else {
      cart.products.push({
        productId: product._id,
        quantity,
        size,
        price:categoryOffer || product.regularPrice - product.productOffer,
        name: product.productName,
        totalPrice:(categoryOffer) * quantity || (product.regularPrice - product.productOffer )*quantity,
        productDiscount:product.productOffer,
      });
    }
    
    cart.totalCartPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0);
    await cart.save();
    res.redirect(`/product-details/${productId}`);
  } catch (error) {
    console.error("Cart Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCart = async (req, res) => {
  try {

    
    const cartId = req.params.cartId;
    const productId = req.params.productId;
 
    const cart = await Cart.findOne({ _id: cartId });

    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    const productIndex = cart.products.findIndex(item => item._id.toString() === productId);
    
    if (productIndex === -1) {
      return res.status(404).send("Product not found in cart");
    }

    cart.totalCartPrice -= cart.products[productIndex].totalPrice;

    cart.products.splice(productIndex, 1);
    if (cart.products.length === 0) {
      await Cart.deleteOne({ _id: cartId });
    } else {
      
      await cart.save();
    }

    res.redirect("/cart");
    
  } catch (error) {
    console.log("cart deleteing error", error);
    res.status(500).send("server error");
  }
};







const updateCart = async (req, res) => {
  try {
    const { productId, action } = req.body;
  

    const email = req.session.userEmail;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.json({
        success: false,
        message: 'User not found'
      });
    }

    const cart = await Cart.findOne({ userId: user._id }).populate('products')
    if (!cart) {
      return res.json({
        success: false,
        message: 'Cart not found'
      });
    }

    const cartItemIndex = cart.products.findIndex(
      (item) => item._id.toString() === productId.toString()
    );

    if (cartItemIndex === -1) {
      return res.json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    const product = await Products.findById(cart.products[cartItemIndex].productId);

    const currentQuantity = cart.products[cartItemIndex].quantity;

    if (action === "increase") {
      if (currentQuantity + 1 > product.quantity) {
        return res.json({
          success: false,
          message: 'Stock not available'
        });
      }else if(currentQuantity + 1 > 5){
        return res.json({
          success:false,
          message: ' Sorry You can Only Order 5 Products At a Time'
        })
      }
      
      cart.products[cartItemIndex].quantity += 1;
      
    } else if (action === "decrease" && currentQuantity > 1) {
      cart.products[cartItemIndex].quantity -= 1;
    }

    cart.totalPrice = cart.products.reduce((total, item) => {
      return total + item.quantity * cart.products[cartItemIndex].price;
    }, 0);
    

    
    cart.products[cartItemIndex].totalPrice = cart.products[cartItemIndex].quantity * cart.products[cartItemIndex].price;

    
    cart.totalCartPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0);

    
    
    
    await cart.save();

    
    const updatedCart = await cart.populate('products.productId');
    const subtotal = updatedCart.products.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    return res.json({
      success: true,
      newQuantity: cart.products[cartItemIndex].quantity,
      subtotal: subtotal.toFixed(2),
      itemTotal: (cart.products[cartItemIndex].quantity * cart.products[cartItemIndex].price).toFixed(2)
    });

   
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.json({
      success: false,
      message: 'Error updating cart'
    });
  }
};

//cart adding from listing page
const addCart = async(req,res)=>{
  try {
    const {productId} = req.body


    const email = req.session.userEmail

    const product = await Products.findById(productId)

    if(!product){
      return res.json({
        success:false,
        message:"product not found"
      })
    }

    const user = await User.findOne({email:email})
    if(!user){
      res.json({
        success:false,
        message:'User not found'
      })
      return res.redirect('/login')
    }

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
              message:'productd addedd successfuly'
            })
} catch (error) {
    console.log('listing page product adding to cart error',error);
    
  }
}
module.exports = {
  loadCart,
  addToCart,
  deleteCart,
  updateCart,
  addCart
};
