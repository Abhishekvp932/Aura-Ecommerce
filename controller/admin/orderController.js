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
const Wallet = require("../../models/walletSchema")
const mongoose = require('mongoose')
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
    const id = req.params.id.trim();

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(404).redirect('/404')
    }

      const orders = await Order.findOne({_id:id}).sort({createdOn:-1}).populate('orderedItems.product')



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
    const data = await Order.findByIdAndUpdate(
      id,
      { $set: { status: "Cancelled" } },
      { new: true }
    );
    res.redirect("/admin/orders");
  } catch (error) {
    console.log("cancel order is not working", error);
    res.status(500).send("server error");
  }
};
const updateStatus = async (req, res) => {
  try {
    const id = req.params.id;
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


const returnSuccess = async (req, res) => {
  try {
    const id = req.query.data;
    console.log('what id',id)
    const orderId = req.query.orderId;
    console.log('what data',orderId)
    const email = req.session.userEmail;

    const user = await User.findOne({ email: email });
        
    const data = await Order.updateOne(
      { _id: orderId, 'orderedItems._id': id },
      { $set: { 'orderedItems.$.status': 'Returned' } }
    );

  
    const order = await Order.findById(orderId).populate('orderedItems');

    const allReturned = order.orderedItems.every(item => item.status === 'Returned');
   

    if (allReturned) {
      await Order.updateOne({ _id: orderId }, { status: 'Returned' });
    }

    const returnedItem = order.orderedItems.find(item => item._id.toString() === id);
    if (!returnedItem) {
      return res.status(404).json({ message: "Returned product not found in order" });
    }

    const orders = await Order.findById(orderId).populate("orderedItems");

    if (!orders) {
      return res.status(404).json({ success: false, message: "Order not found after update" });
    }
    
    
    const canceledItem = orders.orderedItems.find(item => item._id.toString() === id);
    console.log('cancelitems',canceledItem);
    if (!canceledItem) {
      return res.status(404).json({ success: false, message: "Canceled product not found in order" });
    }
    
    const productData = {
      orderId: orders._id,
      createdOn: new Date(),
      productName: canceledItem.product?.productName || "Unknown Product",
      price: canceledItem.totalPrice, 
      status: "Credit",
      orderStatus: "Canceled"
    };
    
  
    let wallet = await Wallet.findOne({ userId: orders.userId });
    
    if (!wallet) {
      wallet = new Wallet({
        userId: orders.userId,
        balance: canceledItem.totalPrice,
        walletData: [productData]
      });
      await wallet.save();
    } else {
      await Wallet.updateOne(
        { userId: orders.userId },
        {
          $inc: { balance: canceledItem.totalPrice }, 
          $push: { walletData: productData }          
        }
      );
    }
    
    res.redirect(`/admin/orderDetails/${orderId}`);

  } catch (error) {
    console.error('Order return error (Admin Side):', error);
    res.status(500).send('Server error');
  }
};


const rejectReturn = async (req,res)=>{
  
  try {
    console.log('1')
   const id = req.query.data.trim();
   const orderId = req.query.orderId.trim()

   const data = await Order.updateOne(
    { _id: orderId, 'orderedItems._id':id },
    { $set: { 'orderedItems.$.status': 'Return Denied' } }
  );


  const order = await Order.findById(orderId).populate('orderedItems');

  const allReturned = order.orderedItems.every(item => item.status === 'Return Denied');

  if (allReturned) {
    await Order.updateOne({ _id: orderId }, { status: 'Return Denied' });
  }
  res.redirect(`/admin/orderDetails/${orderId}`)

  } catch (error) {
    console.log('order rejecting error',error);
  }
}

const returnApprov = async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order Not found"
      });
    }

  
    const update = await Order.updateOne(
      { _id: orderId },
      { 
        $set: { 
          status: "Returned", 
          "orderedItems.$[].status": "Returned" 
        } 
      }
    );

    const orders = await Order.findById(orderId).populate("orderedItems");

    if (!orders) {
      return res.status(404).json({ success: false, message: "Order not found after update" });
    }

    const productData = {
      orderId: orders._id,
      createdOn: new Date(),
      price: orders.totalPrice,
      status: "Credit",
      orderStatus: "Returned"
    };

    let wallet = await Wallet.findOne({ userId: orders.userId });

    if (!wallet) {
      wallet = new Wallet({
        userId: orders.userId,
        balance: orders.totalPrice,
        walletData: [productData]
      });
      await wallet.save();
    } else {
      await Wallet.updateOne(
        { userId: orders.userId },
        {
          $inc: { balance: orders.totalPrice },
          $push: { walletData: productData }          
        }
      );
    }

    return res.json({ success: true, message: "Return request Approved" });
  } catch (error) {
    console.error("Error in returnApprov:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




const returnReject = async(req,res)=>{
  try {
    const {orderId} = req.query
    // console.log('data',data,'order id',orderId)

    const order = await Order.findById(orderId)
    if(!order){
      return res.json({
        success:false,
        message:'Order Not FOund'
      })
    }

    const update = await Order.updateOne(
      { _id: orderId }, 
      { 
          $set: { 
              status: 'Return Denied',  
              'orderedItems.$[].status': 'Return Denied'
          } 
      }
  );
  
    return res.json({success:true,message:'Return rejected'})

  } catch (error) {
    
  }
}



module.exports = {
  loadAdminOrders,
  loadOrderDetails,
  cancelOrder,
  updateStatus,
  returnSuccess,
  returnApprov,
  returnReject,
  rejectReturn
};
