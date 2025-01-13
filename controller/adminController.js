const admins = require("../models/adminSchema");
const User = require("../models/userSchema");
const { options } = require("../routes/userRouter");
const Category = require("../models/categorySchema");
const Products = require("../models/productSchema");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const loadDashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log("admin dashboard not found");
    res.status(500).send("server error");
  }
};

const loadLogin = async (req, res) => {
  try {
    return res.render("adminLogin", { msg: req.flash("err") });
    // return res.send("helo world")
  } catch (error) {
    console.log("page not found");
    res.status(500).send("server error");
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
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
const loadOrders = async (req, res) => {
  try {
    return res.render("orders");
  } catch (error) {
    console.log("orders page is not found");
    res.status(500).send("server error");
  }
};
const loadUsers = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    let limit = 4;
    const Users = await User.find()
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const count = await User.countDocuments();
    console.log(Users);
    const totalPages = Math.ceil(count / limit);
    return res.render("users", {
      Users,
      count,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log("user page not found");
    res.status(500).send("server error");
  }
};
const adminLogout = async (req, res) => {
  try {
    req.session.destroy(() => {
      res.redirect("/admin");
    });
  } catch (error) {
    console.log("admin logout error");
    res.status(500).send("server erro");
  }
};
const loadCategory = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    let limit = 4;

    const category = await Category.find()
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const count = await Category.countDocuments();
    const totalPage = Math.ceil(count / limit);

    return res.render("categories", {
      category,
      count,
      totalPage,
      currentPage: page,
    });
  } catch (error) {
    console.log("category page not found");
    res.status(500).send("server error");
  }
};
const loadOffer = async (req, res) => {
  try {
    return res.render("offers");
  } catch (error) {
    console.log("offer page not found");
    res.status(500).send("server error");
  }
};

const userBlocked = async (req, res) => {
  try {
    const id = req.query.id;

    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log("user blocking error");
    res.status(500).send("server error");
  }
};
const userUnBlocked = async (req, res) => {
  try {
    const id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log("user unblocking error");
    res.status(500).send("server error");
  }
};
const categoryAdd = async (req, res) => {
  try {
    return res.render("addCategory");
  } catch (error) {
    console.log("category page nt found");
    res.status(500).send("server error");
  }
};
const CategoryAdding = async (req, res) => {
  try {
    const { name, description } = req.body;
    console.log(req.body);

    if (name == "" || description == "") {
      req.flash("errMsg", "All Field Required");
      return res.redirect("/admin/categories");
    }

    const data = {
      name: name,
      description: description,
    };
    await Category.insertMany(data);
    res.redirect("/admin/categories");
  } catch (error) {
    console.log("category adding error");
    res.status(500).send("server error");
  }
};
const categoryEdite = async (req, res) => {
  try {
    const id = req.params.id;

    const findCate = await Category.findById(id);
    res.render("editeCategory", { findCate });
  } catch (error) {
    console.log("edite category page not found");
    res.status(500).send("server error");
  }
};
const editeCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const id = req.params.id;

    const data = {
      name: name,
      description: description,
    };
    await Category.updateOne({ _id: id }, { $set: data });
    res.redirect("/admin/categories");
  } catch (error) {
    console.log("category editeing");
    res.status(500).send("server error");
  }
};
const addProductForm = async (req, res) => {
  try {
    const categorie = await Category.find({isListed:true});
    return res.render("addProdcuts", { categorie });
  } catch (error) {
    console.log("add product page not found");
    res.status(500).send("server error");
  }
};
const categoryListed = async (req, res) => {
  try {
    const id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect("/admin/categories");
  } catch (error) {
    console.log("category listing error", error);
    res.status(500).send("server error");
  }
};
const categoryUnList = async (req, res) => {
  try {
    const id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    res.redirect("/admin/categories");
  } catch (error) {
    console.log("category unlisting error", error);
    res.status(500).send("server error");
  }
};
const loadProducts = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    const limit = 5;
    const products = await Products.find()
      .populate("category")
      .limit(limit)
      .skip((page - 1) * limit);
    const count = await Products.countDocuments();
    const totalPage = Math.ceil(count / limit);
    return res.render("products", {
      product: products,
      totalPage,
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
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

        const resizedImageFilename = `resized-${req.files[i].filename}`;
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
        sizeS: products.small,
        sizeM: products.medium,
        sizeL: products.large,
        sizeXL: products.XL,
        sizeXXL: products.XXL,
      },
      colors: products.colors,
      productImage: image,
      status: "Available",
    };

    await Products.insertMany(newProduct);

    return res.redirect("/admin/products");
  } catch (error) {
    console.log("Product adding Problem", error);
    res.status(500).send("Server error");
  }
};
module.exports = {
  loadLogin,
  loadDashboard,
  adminLogin,
  loadProducts,
  loadOrders,
  loadUsers,
  adminLogout,
  loadCategory,
  loadOffer,
  userBlocked,
  userUnBlocked,
  categoryAdd,
  CategoryAdding,
  editeCategory,
  categoryEdite,
  addProductForm,
  categoryListed,
  categoryUnList,
  productsAdd,
};
