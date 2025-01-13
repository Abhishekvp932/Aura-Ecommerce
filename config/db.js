const mongoose = require("mongoose")

const env = require("dotenv").config();


const connectdb = async ()=>{
    try {
        await mongoose.connect(process.env.CONNECTDB)
        console.log('database connected');
        
    } catch (error) {
        console.log('database connection error');

    }
}

module.exports = connectdb;