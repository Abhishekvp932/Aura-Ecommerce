const bcrypt = require("bcrypt");

const saltRound = 10;


const hashPassword  =  async (password)=>{
    try {
        const hashedPassword = await bcrypt.hash(password,saltRound);
        return hashedPassword
    } catch (error) {
        console.log('password hasing error',error)

    }
}

const checkPassword = async (inputPassword,storedHash) =>{
    try {
        return await bcrypt.compare(inputPassword,storedHash)
    } catch (error) {
              console.log('password compareing error',error);
    }
}

module.exports= {
    checkPassword,
    hashPassword,
}