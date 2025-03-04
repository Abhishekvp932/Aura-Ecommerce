const mongoose = require("mongoose");
mongoose.set("strictPopulate", false);

const User = require("../../models/userSchema");
const env = require("dotenv").config();

const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Coupon = require("../../models/couponSchema");

const couponApply = async (req, res) => {
  try {
    const { couponCode, totalAmount } = req.body;
    const email = req.session.userEmail;
    const user = await User.findOne({ email: email });

    const a = couponCode.trim();
    const coupon = await Coupon.findOne({ code: a });

    if (!coupon) {
      return res.json({
        success: false,
        message: "Invalid Coupon code",
      });
    }

    let discount = coupon.offerPrice;
    let newTotal = Math.max(totalAmount - discount, 0);
    req.session.discount = discount;
    const cart = await Cart.findOne({ userId: user._id }).populate("products");

    if (coupon.couponUsers.includes(user._id)) {
      return res.json({
        success: false,
        message: "this user already applyied this coupon",
      });
    }

    const value = cart.products.some((item) => {
      if (cart.totalCartPrice < coupon.minPrice) {
        return true;
      }
    });

    if (value) {
      return res.json({
        success: false,
        message: `If the user makes a purchase of at least ${coupon.minPrice}, then they can apply this coupon.`,
      });
    }
    return res.json({
      success: true,
      newTotal: newTotal.toFixed(2),
      discount,
      message: "Coupon applyied success fully",
    });
  } catch (error) {
    console.log("coupon applying error", error);
    res.status(500).send("server error");
  }
};

const findAllCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.find();
    return res.json({ success: true, coupon });
  } catch (error) {
    console.log("coupon finding error", error);
  }
};

module.exports = {
  couponApply,
  findAllCoupon,
};
