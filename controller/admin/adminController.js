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
const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");

const loadDashboard = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    let limit = 10;

    let skip = (page - 1) * limit;

    const userCount = await User.countDocuments();

    const totalSales = await Order.aggregate([
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$finalAmount" },
          totalOrder: { $sum: 1 },
          totalCouponDiscount: { $sum: "$couponDiscount" },
          totalDiscountPrice: { $sum: "$orderedItems.productDiscount" },
          itemSold: { $sum: 1 },
        },
      },
    ]);

    const salesData = totalSales[0] || {
      totalAmount: 0,
      totalOrder: 0,
      totalDiscount: 0,
      itemSold: 0,
    };
    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const order = await Order.find()
      .sort({ createdOn: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments();
    const totalPage = Math.ceil(count / limit);

    const topOrders = await Order.aggregate([
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: "$orderedItems.product",
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$productDetails.productName",
          orderCount: 1,
        },
      },
    ]);

    const topCategories = await Order.aggregate([
      { $unwind: "$orderedItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderedItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          categoryCount: { $sum: 1 },
        },
      },
      { $sort: { categoryCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $project: {
          _id: 0,
          category: "$_id",
          name: "$categoryDetails.name",
          categoryCount: 1,
        },
      },
    ]);

    return res.render("dashboard", {
      orders: salesData,
      userCount,
      order,
      pendingOrders,
      products: topOrders,
      category: topCategories,
      totalPage,
      currentPage: page,
    });
  } catch (error) {
    
    res.status(500).send("Server error");
  }
};

const loadLogin = async (req, res) => {
  try {
    if (req.session.isLogged) {
      return res.redirect("/admin/dashboard");
    }
    return res.render("adminLogin", { msg: req.flash("err") });
    // return res.send("helo world")
  } catch (error) {
   
    res.status(500).send("server error");
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await admins.findOne({ email: email, password: password });

    if (!admin) {
      req.flash("err", "Incorrect Password or Email");
      return res.redirect("/admin");
    }
    req.session.admin = true;
    req.session.isLogged = true;
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.log("admin login is not working");
    res.status(500).send("server is not working");
  }
};

const adminLogout = async (req, res) => {
  try {
    if (req.session.admin) {
      delete req.session.admin;
      delete req.session.isLogged;
    }
    res.redirect("/admin");
  } catch (error) {
    console.log("admin logout error");
    res.status(500).send("server error");
  }
};

const salesReport = async (req, res) => {
  try {
    const { startDatee, endDatee } = req.query;

    if (!startDatee && endDatee) {
      return res.status(400).json({ error: "Date is required" });
    }

    const startDate = new Date(startDatee);
    const endDate = new Date(endDatee);
    endDate.setHours(23, 59, 59, 999);

    const userCount = await User.countDocuments();

    const pendingOrderCount = await Order.countDocuments({
      status: "pending",
      createdOn: { $gte: startDate, $lte: endDate },
    });

    const order = await Order.find({
      createdOn: { $gte: startDate, $lte: endDate },
    })
      .sort({ finalAmount: -1 })
      .limit(10);
    const salesData = await Order.aggregate([
      { $match: { createdOn: { $gte: startDate, $lte: endDate } } },
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$finalAmount" },
          totalOrder: { $sum: 1 },
          totalCouponDiscount: { $sum: "$couponDiscount" },
          totalDiscountPrice: { $sum: "$orderedItems.productDiscount" },
          itemSold: { $sum: 1 },
        },
      },
    ]);

    const salesReportData = salesData.length
      ? salesData[0]
      : {
          totalAmount: 0,
          totalOrder: 0,
          totalCouponDiscount: 0,
          totalDiscountPrice: 0,
          itemSold: 0,
        };

    const report = {
      ...salesReportData,
      userCount,
      pendingOrderCount,
      order,
    };

    res.json(report);
  } catch (error) {
    console.error("Sales report error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const downloadSalesData = async (req, res) => {
  try {
    const { startDatee, endDatee, salesData } = req.body;

    const startDate = new Date(startDatee);
    const endDate = new Date(endDatee);
    endDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdOn: { $gte: startDate, $lte: endDate },
      status: "Delivered",
    }).populate("orderedItems");

    if (!orders.length) {
      return res
        .status(404)
        .json({ error: "No sales data found for the selected date" });
    }

    const data = orders.map((order) => {
      return {
        "Order ID": order._id.toString(),
        "Amount (₹)": order.finalAmount,
        "Items Sold": order.orderedItems.length,
        Status: order.status,
        Date: new Date(order.createdOn).toLocaleDateString(),
      };
    });

    data.push({});
    data.push({
      "Order ID": "Summary",
      "Amount (₹)": "",
      "Items Sold": "",
      Status: "",
    });
    data.push({
      "Order ID": "Total Orders",
      "Amount (₹)": salesData.totalOrder,
      "Items Sold": "",
      Status: "",
    });
    data.push({
      "Order ID": "Total Items Sold",
      "Amount (₹)": salesData.itemSold,
      "Items Sold": "",
      Status: "",
    });
    data.push({
      "Order ID": "Total Sales",
      "Amount (₹)": `₹${salesData.totalAmount}`,
      "Items Sold": "",
      Status: "",
    });
    data.push({
      "Order ID": "Total Coupon Discount",
      "Amount (₹)": `₹${salesData.totalCouponDiscount}`,
      "Items Sold": "",
      Status: "",
    });
    data.push({
      "Order ID": "Total Discount",
      "Amount (₹)": `₹${salesData.totalDiscountPrice}`,
      "Items Sold": "",
      Status: "",
    });

    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];

    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "007bff" } },
          alignment: { horizontal: "right" },
        };
      }
    }

    const summaryStart = data.length - 5;
    for (let R = summaryStart; R < data.length; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "f8f9fa" } },
          alignment: { horizontal: "left" },
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aura-Men-Sales Report");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${startDatee}-${endDatee}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.end(buffer);
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const { startDatee, endDatee, salesData } = req.body;

    const startDate = new Date(startDatee);
    const endDate = new Date(endDatee);
    endDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdOn: { $gte: startDate, $lte: endDate },
      status: "Delivered",
    });

    if (!orders.length) {
      return res
        .status(404)
        .json({ error: "No sales data found for the selected date" });
    }

    const totalOrders = salesData?.totalOrder || 0;
    const totalAmount = salesData?.totalAmount || 0;
    const totalDiscount = salesData?.totalDiscountPrice || 0;
    const couponDiscount = salesData?.totalCouponDiscount || 0;

    const formattedEndDate = endDatee.replace(/:/g, "-");
    const filePath = `sales-report-${startDatee}-${formattedEndDate}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename="${filePath}"`);
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc
      .fontSize(18)
      .fillColor("#000")
      .text("Aura-Men Sales Report", { align: "center", underline: true });
    doc.moveDown(1);

    doc.fontSize(12);
    doc.text(
      `Date: ${new Date(startDatee).toLocaleDateString()}, ${new Date(
        endDatee
      ).toDateString()}`
    );
    doc.text(`Total Orders: ${totalOrders}`);
    doc.text(`Total Sales: ${totalAmount}`);
    doc.text(`Total Discount: ${totalDiscount}`);
    doc.text(`Coupon Discount: ${couponDiscount}`);
    doc.moveDown(1);

    const startX = 50;
    let startY = doc.y;

    doc
      .fontSize(10)
      .fillColor("#fff")
      .rect(startX, startY, 500, 20)
      .fill("#007bff");
    doc.fillColor("#fff");
    doc.text("Order ID", startX + 10, startY + 5);
    doc.text("Date", startX + 150, startY + 5);
    doc.text("Order Amount", startX + 220, startY + 5);
    doc.text("Discount", startX + 320, startY + 5);
    doc.text("Coupon", startX + 420, startY + 5);
    doc.moveDown(1);

    let rowColor = "#f2f2f2";

    orders.forEach((order, index) => {
      startY = doc.y;

      if (index % 2 === 0) {
        doc.rect(startX, startY, 500, 20).fill(rowColor);
      }

      const productDiscount = order.orderedItems
        ?.reduce((acc, item) => acc + (item.productDiscount || 0), 0)
        .toFixed(2);

      doc.fillColor("#000").fontSize(10);
      doc.text(
        order._id.toString().substring(0, 30) + "",
        startX + 10,
        startY + 5
      );
      doc.text(
        new Date(order.createdOn).toLocaleDateString(),
        startX + 150,
        startY + 5
      );
      doc.text(order.finalAmount.toFixed(2), startX + 220, startY + 5);
      doc.text(productDiscount, startX + 320, startY + 5);
      doc.text(
        order.couponDiscount ? order.couponDiscount.toFixed(2) : "0",
        startX + 420,
        startY + 5
      );

      doc.moveDown(1);
    });

    doc.moveDown(1);
    doc
      .fontSize(8)
      .fillColor("#008000")
      .text("Generated by Aura-Men", { align: "right" });

    doc.end();
  } catch (error) {
    console.log("Download PDF error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

const Chart = async (req, res) => {
  try {
    let { filter } = req.query;

    let matchStage = {};

    if (!filter) filter = "monthly";

    if (filter === "yearly") {
      matchStage = {
        createdOn: { $gte: new Date(new Date().getFullYear(), 0, 1) },
      };
    } else if (filter === "monthly") {
      let startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
      matchStage = { createdOn: { $gte: startOfMonth } };
    } else if (filter === "weekly") {
      let startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      matchStage = { createdOn: { $gte: startOfWeek } };
    } else {
      matchStage = {};
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdOn" } },
          totalSales: { $sum: "$finalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (!salesData || salesData.length === 0) {
      return res.json({
        labels: [],
        values: [],
        message: "No data found for the selected period",
      });
    }

    const labels = salesData.map((data) => data._id);
    const values = salesData.map((data) => data.totalSales);

    res.json({ labels, values });
  } catch (error) {
    console.error("Chart aggregation error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
};

module.exports = {
  loadLogin,
  loadDashboard,
  adminLogin,
  adminLogout,
  salesReport,
  downloadSalesData,
  downloadPDF,
  Chart,
};
