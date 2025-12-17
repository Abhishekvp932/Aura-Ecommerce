const mongoose = require("mongoose");
mongoose.set("strictPopulate", false);
const User = require("../../models/userSchema");
const env = require("dotenv").config();
const Razorpay = require("razorpay");

const Products = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const offers = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Wallet = require("../../models/walletSchema");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const Coupon = require("../../models/couponSchema");

const loadOrdersPage = async (req, res) => {
  try {
    const userLoged = req.session.userLoged;
    const email = req.session.userEmail;

    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    let limit = 4;

    let skip = (page - 1) * limit;

    const count = await Order.countDocuments();
    const totalPage = Math.ceil(count / limit);

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.render("userOrders", {
        userLoged,
        order: [],
        currentPage: 1,
        totalPage: 1,
      });
    }

    const order = await Order.find({ userId: user._id })
      .sort({ createdOn: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("orderedItems.product");

    return res.render("userOrders", {
      userLoged,
      order,
      totalPage,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error loading user order page:", error);
    res.status(500).send("Server error");
  }
};

const orderSummary = async (req, res) => {
  try {
    const userLoged = req.session.userLoged;
    const id = req.params.id;
    const email = req.session.userEmail;
    const user = await User.findOne({ email: email });
    if (!user) {
      req.flash("err", "user not found");
      res.redirect("/login");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).redirect("/404");
    }

    const orders = await Order.findById(id).populate("orderedItems.product");
    if (!orders) {
      return res.status(404).redirect("/404");
    }

    const address = await Address.findOne({
      "addresses._id": orders.address,
    });

    let selectedAddress;

    if (address) {
      selectedAddress = address.addresses.find(
        (value) => value._id.toString() === orders.address.toString()
      );
    } else {
      console.log("No address found");
    }

    return res.render("orderSummary", {
      userLoged,
      orders: orders,
      address: selectedAddress,
    });
  } catch (error) {
    console.log("orderSummary page not found", error);
    res.status(500).send("server error");
  }
};

const orderCancel = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const email = req.session.userEmail;

    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect("/login");
    }

    const order = await Order.findById(id).populate("orderedItems.product");
    if (!order) {
      return res.status(404).send("Order not found");
    }

    const productIndex = order.orderedItems.findIndex(
      (item) => item._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).send("Product not found in the order");
    }

    const canceledProduct = order.orderedItems[productIndex];
    const { totalPrice, quantity, size } = canceledProduct;

    order.orderedItems[productIndex].status = "Cancelled";
    order.finalAmount -= totalPrice;

    const product = await Products.findById(canceledProduct.product._id);
    if (product) {
      if (product.size[size] !== undefined) {
        product.size[size] += quantity;
      }
      product.quantity += quantity;
      await product.save();
    }

    const activeItems = order.orderedItems.filter(
      (item) => item.status !== "Cancelled"
    );
    if (activeItems.length === 0) {
      order.status = "Cancelled";
    }

    await order.save();

    const productData = {
      orderId: order._id,
      createdOn: order.createdOn,
      productName: canceledProduct.product?.productName || "Unknown Product",
      price: totalPrice,
      status: "Credit",
      orderStatus: "Cancelled",
    };

    const walletUpdate = await Wallet.updateOne(
      { userId: user._id },
      {
        $inc: { balance: totalPrice },
        $push: { walletData: productData },
      },
      { upsert: true }
    );

    if (walletUpdate.upserted) {
      console.log("New wallet created for user:", user._id);
    } else {
      console.log("Wallet updated for user:", user._id);
    }

    res.render("cancel");
  } catch (error) {
    console.error("Order cancel error:", error);
    res.status(500).send("Server error");
  }
};

const returnRequest = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const productId = req.query.productId;
    const reason = req.query.reason;

    const response = await Order.updateOne(
      {
        _id: orderId,
        "orderedItems._id": productId,
      },
      {
        $set: {
          "orderedItems.$.status": "Return Request",
          "orderedItems.$.returnReason": reason,
        },
      }
    );

    const updatedOrder = await Order.findById(orderId).populate("orderedItems");

    const allReturned = updatedOrder.orderedItems.every(
      (item) => item.status === "Return Request"
    );

    if (allReturned) {
      const result = await Order.updateOne(
        { _id: orderId },
        { status: "Return Request" }
      );
    }

    return res.json({
      success: true,
      message: "Your Return Request Sent Successfully",
      redirectUrl: `/orderSummary${orderId}`,
    });
  } catch (error) {
    console.log("Product return error:", error);
    return res.json({
      success: false,
      message: "Return product error",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    console.log("order request is coming...");

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderedItems,
      paymentMethod,
      totalPrice,
      couponDiscount,
      finalAmount,
      address,
      userId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
    const newOrder = await Order.create({
      userId,
      orderedItems,
      paymentMethod,
      totalPrice,
      couponDiscount,
      finalAmount,
      address,
      invoiceDate: new Date(),
      status: "Pending",
      couponApplied: couponDiscount > 0,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    const couponCode = req.session.couponCode;

    if (couponDiscount > 0 && couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode },
        { $addToSet: { couponUsers: userId } }
      );
    }

    for (const item of orderedItems) {
      const product = await Products.findById(item.product);
      if (!product) {
        return res.json({ success: false, message: "Product not found" });
      }

      if (!product.size[item.size] || product.size[item.size] < item.quantity) {
        return res.json({
          success: false,
          message: `Insufficient stock for size ${item.size}`,
        });
      }

      product.size[item.size] -= item.quantity;
      product.quantity -= item.quantity;
      await product.save();
    }

    await Cart.deleteMany({ userId });

    return res.json({
      success: true,
      paymentId: razorpay_payment_id,
      redirectUrl: "/userOrders",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};

const placeFieldOrders = async (req, res) => {
  // console.log('place filed order request is comming ...');
  try {
    const {
      orderId,
      orderedItems,
      paymentMethod,
      totalPrice,
      couponDiscount,
      finalAmount,
      address,
      userId,
    } = req.body;

    const newOrder = await Order.create({
      orderId,
      orderedItems,
      paymentMethod,
      totalPrice,
      couponDiscount,
      finalAmount,
      invoiceDate: new Date(),
      address,
      userId,
      status: "Pending Payment",
    });
    await Cart.deleteOne({ userId: userId });
    return res.json({
      success: true,
      message: "Order placed",
      redirectUrl: "/userOrders",
    });
  } catch (error) {
    console.log("field order placing error", error);
  }
};

// const razorpay = new Razorpay({
//   key_id: "rzp_test_UJHrF4ZCERjDBB",
//   key_secret: "QucZPITL3a19mTmRO5bvA62u",
// });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazoPayOrder = async (amount) => {
  try {
    const options = {
      amount: amount * 100,
      currency: "INR",
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new Error("Failed to create Razorpay order");
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const razorpayOrder = await createRazoPayOrder(order.finalAmount);

    res.json({
      success: true,
      key: "rzp_test_UJHrF4ZCERjDBB",
      amount: razorpayOrder.amount,
      razorpay_order_id: razorpayOrder.id,
      id: orderId,
    });
  } catch (error) {
    console.error("Retry payment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing payment" });
  }
};

const retryPaymentVerify = async (req, res) => {
  try {
    const { order_id, payment_id, signature, orderId } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", "QucZPITL3a19mTmRO5bvA62u")
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.json({
        success: false,
        message: "Payment verification failed",
      });
    }
    const order = await Order.findById(orderId).populate(
      "orderedItems.product"
    );

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    await Order.updateOne({ _id: orderId }, { status: "Pending" });

    for (const item of order.orderedItems) {
      const product = item.product;

      if (!product) {
        return res.json({ success: false, message: "Product not found" });
      }

      if (!product.size[item.size] || product.size[item.size] < item.quantity) {
        return res.json({
          success: false,
          message: `Insufficient stock for size ${item.size}`,
        });
      }
      product.size[item.size] -= item.quantity;
      product.quantity -= item.quantity;
      await product.save();
    }
    return res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Retry payment verification error:", error);
    return res.json({
      success: false,
      message: "Payment verification error",
    });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(orderId)
      .populate("orderedItems.product")
      .populate("userId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc
      .fontSize(20)
      .text("Product Invoice-Aura-Men-Store", { align: "center" })
      .moveDown();
    doc.fontSize(12).text(`Customer Name: ${order.userId.name}`);
    doc.text(`Email: ${order.userId.email}`);

    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    const address = await Address.findOne({
      "addresses._id": order.address,
    });
    let selectedAddress;

    if (address) {
      selectedAddress = address.addresses.find(
        (value) => value._id.toString() === order.address.toString()
      );
    } else {
      console.log("No address found");
    }

    doc.moveDown();
    doc.text(selectedAddress?.state || "State not available");
    doc.text(selectedAddress?.city || "city not available");
    doc.text(selectedAddress?.addressType || "Address type not available");
    doc.text(selectedAddress?.landMark || "Land Mark not available");
    doc.text(selectedAddress?.pincode || "pincode not available");
    doc.text(selectedAddress?.phone || "Phone not available");

    doc.moveDown();
    doc.text(`Delivery Date: ${new Date("2025-02-19").toLocaleDateString()}`);

    doc.moveDown();
    const tableTop = doc.y;
    const tableWidth = 500;

    doc.rect(50, tableTop, tableWidth, 20).fill("#87CEEB");

    doc
      .fillColor("black")
      .text("Product", 55, tableTop + 5)
      .text("Status", 180, tableTop + 5)
      .text("size", 280, tableTop + 5)
      .text("Quantity", 380, tableTop + 5)
      .text("Amount", 450, tableTop + 5);

    doc.moveDown(2);
    const startY = doc.y;

    order.orderedItems.forEach((item, index) => {
      doc.text(item.product.productName, 55, startY + index * 20);
      doc.text(order.status, 180, startY + index * 20);
      doc.text(item.size, 280, startY + index * 20);
      doc.text(item.quantity.toString(), 380, startY + index * 20);
      doc.text(`₹${item.price}`, 450, startY + index * 20);
    });

    doc.moveDown(2);
    const leftMargin = 50;
    const rightAlign = 500;

    const writeAlignedPair = (label, value) => {
      doc.text(label, leftMargin, doc.y);
      doc.text(value, rightAlign, doc.y - 12, { align: "right" });
    };

    writeAlignedPair("Total Amount:", order.totalPrice);
    writeAlignedPair("Discount:", order.couponDiscount);

    doc.text("Total Payable:", leftMargin);
    doc
      .text(order.finalAmount, rightAlign, doc.y - 12, { align: "right" })
      .underline(rightAlign - 50, doc.y - 12, 50, 1);

    doc.moveDown();
    doc.text(`Payment Status:${order.paymentMethod}`, leftMargin);

    doc.moveDown(2);
    doc.text("Thanks for Shopping!", { align: "right" });
    doc.text("Aura-Men", { align: "right" });
    doc.text("Address:", { align: "right" });
    doc.text("1527 Fashion Ave", { align: "right" });
    doc.text("Los Angeles", { align: "right" });
    doc.text("CA 90015", { align: "right" });
    doc.text("USA", { align: "right" });
    doc.moveDown();
    doc.text("Auramen@gmail.com", { align: "right" });
    doc.text("+1 (213) 555-7890", { align: "right" });

    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  loadOrdersPage,
  orderSummary,
  orderCancel,
  returnRequest,
  verifyPayment,
  placeFieldOrders,
  retryPayment,
  retryPaymentVerify,
  downloadInvoice,
};
