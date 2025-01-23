
const admins = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const { options } = require("../../routes/userRouter");
const Category = require("../../models/categorySchema");
const Products = require("../../models/productSchema");
const Offer = require('../../models/offerSchema');
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const Product = require("../../models/productSchema");
const router = require("../../routes/userRouter");
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');


const loadAdminOrders = async (req, res) => {
    try {
      const userLoged = req.session.userLoged
      const order = await Order.aggregate([
        {
          $lookup: {
            from: "addresses",
            localField: "address",
            foreignField: "_id",
            as: "addressArray"
          }
        },
        {
          $addFields: {
            addressArray: {
              $cond: {
                if: { $gt: [{ $size: "$addressArray" }, 0] },
                then: "$addressArray",
                else: []
              }
            }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "orderedItems.product",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        {
          $unwind: "$productDetails"
        },
        {
          $addFields: {
            quantity: { $sum: "$orderedItems.quantity" },
            orderedProductPrice: { $sum: "$orderedItems.price" }
          }
        },


        {
          $lookup: {
            from: "categories",
            localField: "productDetails.category",
            foreignField: "_id",
            as: "categoryDetails"
          }
        },
      

        {
          $lookup: {
            from: "users",
            localField: "addressArray.userId",
            foreignField: "_id",
            as: "userData"
          }
        },
      
      ]);

      // console.log(order.map(i=> console.log(i)))
      return res.render("orders",{
        userLoged,
        order
      });
    } catch (error) {
      console.log(error.message)
      console.log("orders page is not found");
      res.status(500).send("server error");
    }
  };

  module.exports ={
    loadAdminOrders,
  }