const mongoose = require("mongoose")

const env = require("dotenv").config();


const connectdb = async ()=>{
    try {
       const conn = await mongoose.connect(process.env.CONNECTDB)
        console.log(conn.connection.host)
        console.log(conn.connection.name)
        console.log('database connected');
        
    } catch (error) {   
	console.log("error is: ",error.message)   
<<<<<<< HEAD
	console.log("demo")
    
=======


>>>>>>> c84365ad3fc467eb724383c47c95a89a11dd3737
console.log("error",error)        
console.log('database connection error');

    }
}

module.exports = connectdb;
