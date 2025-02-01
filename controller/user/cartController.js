const User = require("../../models/userSchema");
const env = require("dotenv").config();

const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");

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

console.log('cart user',cartItem)


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

    if (existingProduct) {
      const updatedQuantity = existingProduct.quantity + quantity;
      if (updatedQuantity > product.size[size]) {
        req.flash('err', 'Not enough stock available for this size');
        return res.redirect(`/product-details/${productId}`);
      }

      existingProduct.quantity = updatedQuantity;
      existingProduct.totalPrice = existingProduct.price * existingProduct.quantity;
    } else {
      cart.products.push({
        productId: product._id,
        quantity,
        size,
        price: product.regularPrice,
        name: product.productName,
        totalPrice: product.regularPrice * quantity,
      });
    }

    
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
    console.log("cart id", cartId);
    console.log("product id", productId);

    const result = await Cart.updateOne(
      { _id: cartId },
      { $pull: { products: { _id: productId } } }
    );
    console.log("result", result);
    res.redirect("/cart");
  } catch (error) {
    console.log("cart deleteing error", error);
    res.status(500).send("server error");
  }
};

const updateCart = async (req, res) => {
  try {
    const { productId, action } = req.body;
    console.log("Nested cart product id is ", productId);

    const email = req.session.userEmail;
    const user = await User.findOne({ email: email });

    if (!user) {
      console.log("User not found");
      return res.redirect('/login')
    }

    const cart = await Cart.findOne({ userId: user._id });

    // if (!cart || !cart.products || cart.products.length === 0) {
    //   console.log("Cart is empty or does not exist.");
    //   return res.status(404).send("Cart not found or empty");
    // }

    console.log("Cart Products:", cart.products);

    const cartItemIndex = cart.products.findIndex(
      (item) => item._id.toString() === productId.toString()
    );

    console.log("Cart Item Index Found:", cartItemIndex);

   

    const product = await Products.findById(cart.products[cartItemIndex].productId);

    if (action === "increase") {
      const currentQuantity = cart.products[cartItemIndex].quantity;
      console.log("Current Quantity:", currentQuantity);

      if (currentQuantity + 1 > product.quantity || currentQuantity + 1 > 5) {
        req.flash("err", "Stock not available");
        return res.redirect("/cart");
      }

      cart.products[cartItemIndex].quantity += 1;
    } else if (action === "decrease") {
      if (cart.products[cartItemIndex].quantity > 1) {
        cart.products[cartItemIndex].quantity -= 1;
      }
    }

    await cart.save();
    console.log("Cart updated successfully");
    res.redirect("/cart");
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).send("Error updating cart quantity");
  }
};

module.exports = {
  loadCart,
  addToCart,
  deleteCart,
  updateCart,
};
