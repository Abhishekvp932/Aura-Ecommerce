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
const cron = require("node-cron");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    await Offer.deleteMany({ endDate: { $lt: now } });
  } catch (error) {
    console.error("Error deleting expired offers:", error);
  }
});

const loadOffer = async (req, res) => {
  try {

    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    let limit = 7;

    let skip = (page - 1) * limit;

    const offers = await Offer.find().limit(limit * 1)
    .skip(skip).populate("category");
    const count = await Offer.countDocuments()
    const totalPage = Math.ceil(count / limit)

    return res.render("offers", {
      offers,
      count,
      totalPage,
      currentPage: page
    });
  } catch (error) {
    console.log("offer page not found");
    res.status(500).send("server error");
  }
};

const offerAdd = async (req, res) => {
  try {
    const category = await Category.find();
    return res.render("addOffers", { category });
  } catch (error) {
    console.log("offer adding page not found");
    res.status(500).send("server error");
  }
};

const addOffer = async (req, res) => {
  try {
    const { categoryy, startDate, endDate, minPrice, maxPrice, offer } =
      req.body;

    if (
      !categoryy ||
      !startDate ||
      !endDate ||
      !minPrice ||
      !maxPrice ||
      !offer
    ) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    const category = await Category.findOne({ name: categoryy });
    if (!category) {
      return res.json({
        success: false,
        message: "Category not found",
      });
    }

    const offerData = new Offer({
      startDate,
      endDate,
      minPrice,
      maxPrice,
      category: category._id,
      offer,
    });

    await offerData.save();

    res.json({
      success: true,
      message: "Offer added successfully",
      redirectUrl: "/admin/offers",
    });
  } catch (error) {
    console.error("Offer adding error:", error);
    res.status(500).send("Server error");
  }
};

const offerList = async (req, res) => {
  try {
    const id = req.params.id;
    await Offer.updateOne({ _id: id }, { $set: { isActive: true } });
    res.redirect("/admin/offers");
  } catch (error) {
    console.log("product listing error", error);
    res.status(500).send("server error");
  }
};

const offerUnList = async (req, res) => {
  try {
    const id = req.params.id;
    await Offer.updateOne({ _id: id }, { $set: { isActive: false } });
    res.redirect("/admin/offers");
  } catch (error) {
    console.log("offer unlisting error");
    res.status(500).send("server error");
  }
};

const editeOffer = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).redirect("/404");
    }
    const offerFind = await Offer.findById(id);
    const category = await Category.find();
    res.render("editeOffer", { offerFind, category });
  } catch (error) {
    console.log("edite page is not found", error);
    res.status(500).send("server error");
  }
};
const offerEdite = async (req, res) => {
  try {
    const id = req.params.id;
    const offer = req.body;
    const category = await Category.findOne({ name: offer.category });
    const updateOfferData = {
      startDate: offer.startDate,
      endDate: offer.endDate,
      minPrice: offer.minPrice,
      maxPrice: offer.maxPrice,
      category: category._id,
      offer: offer.offer,
    };
    await Offer.updateOne({ _id: id }, { $set: updateOfferData });
    res.redirect("/admin/offers");
  } catch (error) {}
};

module.exports = {
  loadOffer,
  offerAdd,
  offerEdite,
  offerList,
  offerUnList,
  addOffer,
  editeOffer,
};
