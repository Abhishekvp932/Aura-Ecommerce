const mongoose = require("mongoose")

const env = require("dotenv").config();


const connectdb = async ()=>{
    try {
       const conn = await mongoose.connect(process.env.CONNECTDB)
        console.log(conn.connection.host)
        console.log(conn.connection.name)
        console.log('database connected');
        
    } catch (error) {
        console.log('database connection error');

    }
}

module.exports = connectdb;