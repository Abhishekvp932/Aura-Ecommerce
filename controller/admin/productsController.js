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
const Cart = require("../../models/cartSchema");
const mongoose = require("mongoose");

const loadProducts = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    const limit = 5;
    const product = await Products.find()
      .populate("category")
      .limit(limit)
      .skip((page - 1) * limit);
    const count = await Products.countDocuments();
    const totalPage = Math.ceil(count / limit);
    return res.render("products", {
      product,
      totalPage,
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

const addProductForm = async (req, res) => {
  try {
    const categorie = await Category.find({ isListed: true });
    return res.render("addProdcuts", { categorie });
  } catch (error) {
    console.log("add product page not found");
    res.status(500).send("server error");
  }
};

const productsAdd = async (req, res) => {
  try {
    const products = req.body;
    const { category } = req.body;
    const productExists = await Products.findOne({
      productName: products.productName,
    });
    if (productExists) {
      req.flash("err", "Product already exists, please try another name");
      return res.redirect("/admin/addProducts");
    }

    const image = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const originalImagePath = req.files[i].path;

        const uploadsDir = path.join(__dirname, "../public/uploads");

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const resizedImageFilename = `${req.files[i].filename}`;
        const resizedImagePath = path.join(uploadsDir, resizedImageFilename);

        await sharp(originalImagePath)
          .resize({ width: 300, height: 300 })
          .toFile(resizedImagePath);

        image.push(resizedImageFilename);
      }
    }

    const newProduct = {
      productName: products.productName,
      description: products.description,
      regularPrice: products.regularPrice,
      quantity: products.quantity,
      category: products.category,
      size: {
        small: products.small,
        medium: products.medium,
        large: products.large,
        XL: products.XL,
        XXL: products.XXL,
      },
      colors: products.colors,
      productImage: image,
      status: "Available",
    };
    await Products.insertMany(newProduct);

    return res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
    console.log("Product adding Problem", error);
    res.status(500).send("Server error");
  }
};

const editeProduct = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).redirect("/404");
    }
    const product = await Product.findById(id);
    const category = await Category.find();
    res.render("editeProduct", { product, category });
  } catch (error) {
    console.log("product edite page is not found", error);
    res.status(500).send("server error");
  }
};

const productEdite = async (req, res) => {
  try {
    const products = req.body;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).redirect("/404");
    }

    const image = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const originalImagePath = req.files[i].path;

        const uploadsDir = path.join(__dirname, "../public/uploads");

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const resizedImageFilename = `${req.files[i].filename}`;
        const resizedImagePath = path.join(uploadsDir, resizedImageFilename);

        await sharp(originalImagePath)
          .resize({ width: 300, height: 300 })
          .toFile(resizedImagePath);

        image.push(resizedImageFilename);
      }
    }
    const updatedProduct = {
      productName: products.productName,
      description: products.description,
      regularPrice: products.regularPrice,
      quantity: products.quantity,
      category: products.category,
      size: {
        small: products.small,
        medium: products.medium,
        large: products.large,
        XL: products.XL,
        XXL: products.XXL,
      },
      colors: products.colors,
      productImage: image.length === 0 ? req.body.existingImages : image,
      status: products.quantity > 0 ? "Available" : "Out of Stock",
    };

    await Product.updateOne({ _id: id }, { $set: updatedProduct });

    const newProductQuantity = parseInt(products.quantity);
    if (newProductQuantity > 0) {
      await Cart.updateMany(
        { "products.productId": id },
        {
          $set: {
            "products.$[elem].quantity": newProductQuantity,
          },
        },
        {
          arrayFilters: [
            {
              "elem.productId": id,
              "elem.quantity": { $gt: newProductQuantity },
            },
          ],
        }
      );
    } else {
      await Cart.updateMany(
        { "products.productId": id },
        { $pull: { products: { productId: id } } }
      );
    }

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Product editing error:", error.message);
    res.status(500).send("Server error");
  }
};

const productBlock = async (req, res) => {
  try {
    const id = req.params.id;

    await Product.findByIdAndUpdate(id, { $set: { isBlocked: true } });
    return res.redirect("/admin/products");
  } catch (error) {
    console.log("product blocking error", error);
    res.status(500).send("server error");
  }
};
const productUnBlock = async (req, res) => {
  try {
    const id = req.params.id;
    await Product.findByIdAndUpdate(id, { $set: { isBlocked: false } });
    return res.redirect("/admin/products");
  } catch (error) {
    console.log("product unbloking error");
    res.status(500).send("server error");
  }
};

const saveOffer = async (req, res) => {
  try {
    const { offer } = req.body;
    const { productId } = req.query;

    if (!offer) {
      return res.json({
        success: false,
        message: "Plase enter a amount",
      });
    }
    const product = await Product.findById(productId);

    if (!product) {
      return res.json({
        success: false,
        message: "product not found",
      });
    }

    await Product.updateOne({ _id: productId }, { productOffer: offer });
    res.json({
      success: true,
      message: "offer addedd successfuly",
    });
  } catch (error) {
    console.log("product offer adding error", error);
    return res.json({
      success: false,
      message: "product offer adding error",
    });
  }
};

module.exports = {
  loadProducts,
  addProductForm,
  productsAdd,
  productEdite,
  editeProduct,
  productBlock,
  productUnBlock,
  saveOffer,
};
