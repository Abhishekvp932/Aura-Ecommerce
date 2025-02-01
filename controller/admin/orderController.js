const admins = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const { options } = require("../../routes/userRouter");
const Category = require("../../models/categorySchema");
const Products = require("../../models/productSchema");
const Offer = require("../../models/offerSchema");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const Product = require("../../models/productSchema");
const router = require("../../routes/userRouter");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");

const loadAdminOrders = async (req, res) => {
  try {


    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    let limit = 7;

    let skip = (page - 1) * limit;

  const count = await Order.countDocuments();
  const totalPage = Math.ceil(count / limit);



    const userLoged = req.session.userLoged;
    const order = await Order.aggregate([
      {$sort:{createdOn:-1}},
      {$skip:(page-1)*limit},
      {$limit:limit},
      {
        $lookup: {
          from: "addresses",
          localField: "address",
          foreignField: "_id",
          as: "addressArray",
        },
      },
      {
        $addFields: {
          addressArray: {
            $cond: {
              if: { $gt: [{ $size: "$addressArray" }, 0] },
              then: "$addressArray",
              else: [],
            },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "orderedItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $addFields: {
          quantity: { $sum: "$orderedItems.quantity" },
          orderedProductPrice: { $sum: "$orderedItems.price" },
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
    ]);

    return res.render("orders", {
      userLoged,
      order,
      count,
      totalPage,
      currentPage: page, 
    });
  } catch (error) {
    console.log(error.message);
    console.log("orders page is not found");
    res.status(500).send("server error");
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("order id is ", id);

      const orders = await Order.findOne({_id:id}).sort({createdOn:-1}).populate('orderedItems.product')

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

    return res.render("orderDetails",{orderData:orders,address:selectedAddress})
   
    // console.log(add)
  } catch (error) {
    console.log("order details page not found", error);
    res.status(500).send("server error");
  }
};
const cancelOrder = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const data = await Order.findByIdAndUpdate(
      id,
      { $set: { status: "Cancelled" } },
      { new: true }
    );
    console.log("update data", data);
    res.redirect("/admin/orders");
  } catch (error) {
    console.log("cancel order is not working", error);
    res.status(500).send("server error");
  }
};
const updateStatus = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("update order id", id);
    const { newStatus } = req.body;
    const validStatuses = ["Pending", "Shipped", "Delivered", "Canceled"];
    if (!validStatuses.includes(newStatus)) {
      req.flash("err", "invalid status code");
      return res.redirect("/admin/orders");
    }
    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status: newStatus } },
      { new: true }
    );
    res.redirect("/admin/orders");
  } catch (error) {
    console.log("order status updating error", error);
    res.status(500).send("server error");
  }
};
module.exports = {
  loadAdminOrders,
  loadOrderDetails,
  cancelOrder,
  updateStatus,
};
