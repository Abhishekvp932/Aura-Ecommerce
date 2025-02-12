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
const Coupon = require('../../models/couponSchema')


const loadCoupons = async(req,res)=>{
    try {


        const coupon = await Coupon.find();

       res.render('coupons',{
        coupon,
       })
    } catch (error) {
        console.log('count page loading error',error)
        res.status(500).send('server error')
    }
}
const couponAdd = async(req,res)=>{
    try {
        return res.render('addCoupons')
    } catch (error) {
        console.log('coupon adding page error',error)
        res.status(500).send('server error');
    }
}

const addCoupons = async(req,res)=>{
    try {
        const {code,offerPrice,minPrice,maxPrice,description} = req.body
          console.log('max price',req.body.maxPrice)
        if(!code||!offerPrice||!minPrice||!maxPrice||!description){
            req.flash('err','All fields requierd')
            return res.redirect('/admin/addCoupons')
        }
        const newData = {
            code:code,
            offerPrice:offerPrice,
            minPrice:minPrice,
            maxPrice:maxPrice,
            description:description
        }
        console.log('coupon data',newData)
        const coupon = await Coupon.insertMany(newData)
        res.redirect('/admin/coupons')
        console.log('coupon addedd success fully')

    } catch (error) {
        console.log('coupon adding error',error)
        res.status(500).send('server error');
    }
}

const couponDelete = async(req,res)=>{
    try {
       const {id} = req.params

       console.log('delete coupon id is ',id)

    const result = await Coupon.deleteOne({_id:id})
    res.redirect('/admin/coupons')

    console.log('result is',result)

    } catch (error) {
        console.log('coupon deleteing error',error)
        res.status(500).send('server error');
    }
}

module.exports = {
    loadCoupons,
    couponAdd,
    addCoupons,
    couponDelete
}