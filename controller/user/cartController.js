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

    const cart = await Cart.findOne({ userId: user._id }).populate(
      "products.productId"
    );

    if (!cart || cart.products.length === 0) {
      return res.render("cart", {
        userLoged,
        cart: [],
        cartId: cart?._id || null,
        totalPrice: 0,
      });
    }

    // const totalPrice = cart.products.reduce((total, item) => {
    //   if (item.productId) {
    //     return total + item.productId.regularPrice * item.quantity;
    //   }
    //   return total;
    // }, 0);
const cartItem = await Cart.find();


console.log('cart itmes',cartItem)


    return res.render("cart", {
      userLoged,
      cart: cart.products,
      cartId: cart._id,

      
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
    console.log(quantity);

    const size = req.body.size;
    const email = req.session.userEmail;

    const product = await Products.findById(productId);

    const user = await User.findOne({ email: email });
    let cart = await Cart.findOne({ userId: user._id });

    if (!cart) {
      cart = new Cart({ userId: user._id, products: [] });
    }

    const existingProduct = cart.products.find(
      (item) => item.productId.toString() === productId && item.size === size
    );
    // console.log('old product is here',existingProduct);

    if (existingProduct) {
      existingProduct.quantity += quantity;
      // console.log('type of',typeof existingProduct.quantity);
      // console.log("value",existingProduct.quantity)
      existingProduct.totalPrice =
        existingProduct.price * existingProduct.quantity;
    } else {
      cart.products.push({
        productId: product._id,
        quantity: parseInt(quantity),
        size: size,
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
      { $pull: { products: { productId: productId } } }
    );
    console.log("result", result);
    res.redirect("/cart");
  } catch (error) {
    console.log("cart deleteing error", error);
    res.status(500).send("server error");
  }
};

module.exports = {
  loadCart,
  addToCart,
  deleteCart,
};
