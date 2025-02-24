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
        if(!code||!offerPrice||!minPrice||!maxPrice||!description){
           
            return res.json({
                success:false,
                message:'All fields Requierd'
            })
        }
        const newData = {
            code:code,
            offerPrice:offerPrice,
            minPrice:minPrice,
            maxPrice:maxPrice,
            description:description
        }
        const coupon = await Coupon.insertMany(newData)
       return res.json({
        success:true,
        message:'Coupon Applied successfuly',
        redirectUrl:'/admin/coupons'
       })

    } catch (error) {
        console.log('coupon adding error',error)
        res.status(500).send('server error');
    }
}

const couponDelete = async(req,res)=>{
    try {
       const {id} = req.params


    const result = await Coupon.deleteOne({_id:id})
    res.redirect('/admin/coupons')


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