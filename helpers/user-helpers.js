var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
var objId=require('mongodb').ObjectID
const { ObjectID } = require('mongodb')

module.exports = {
    doSignup: function (userData) {

        let response = { status: true }
        return new Promise(async (resolve, reject) => {
            let email = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (email) {
                response.status = false
                reject(response)
            } else {
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne({
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,
                    admin: false
                })
                response.user = userData
                response.status = true
                resolve(response)
            }


        })
    },
    doLogin: function (userData) {

        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email:userData.email})

            if (user) {
                if (user.admin) {
                    bcrypt.compare(userData.password, user.password).then((status) => {

                        if(status){
                            response.status = true
                            response.user = user
                            response.admin = true
                            resolve(response)
                        }else{
                            response.status=false
                            reject(response)
                        }
                        
                    })
                } else {
                    bcrypt.compare(userData.password, user.password).then((status) => {

                        if (status) {
                            response.user = user
                            response.status = true
                            resolve(response)

                        } else {
                            response.status = false
                            reject(response)

                        }
                    })
                }
            } else {
                response.status = false
                reject(response)

            }
        })
    },
    getSingleUser:function(userData){
        
        return new Promise(async(resolve,reject)=>{
            
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            resolve(user)
        })

    },
    addToCart:function(proId,userId){
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objId(userId)})
            if(userCart){
                
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objId(userId)},{
                   
                        $push:{products:objId(proId)}
                    
                }).then((response)=>{
                    resolve()
                })
            }else{
                let cartObj={
                    user:objId(userId),
                    products:[objId(proId)]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:function(userId){
        return new Promise(async (resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objId(userId)}
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        let:{prodList:'$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id',"$$prodList"]
                                    }
                                }
                            }
                        ],
                        as:'cartItems'
                    }
                }
            ]).toArray()
            resolve(cartItems[0].cartItems)
        })
    },
    getAllUsers:function(){
        return new Promise(async(resolve,reject)=>{
            users=await db.get().collection(collection.USER_COLLECTION).find({admin:false}).toArray()
            resolve(users)
        })
    },
    blockUser:function(proId){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objId(proId)},{
                $set:{
                    block:true
                }
            })
        })
    }

}