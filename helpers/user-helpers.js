var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
var objId = require('mongodb').ObjectID
const { ObjectID } = require('mongodb')
const { response } = require('express')

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

                    admin: false,
                    block: false
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
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (user && user.block == false) {

                if (user.admin) {
                    bcrypt.compare(userData.password, user.password).then((status) => {

                        if (status) {
                            response.status = true
                            response.user = user
                            response.admin = true
                            resolve(response)
                        } else {
                            response.status = false
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
    getSingleUser: function (userData) {

        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            resolve(user)
        })

    },
    addToCart: function (proId, userId) {

        let proObj = {
            item: objId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(products => products.item == proId)

                if (proExist != -1) {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ 'products.item': objId(proId), user: objId(userId) }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objId(userId) }, {

                        $push: { products: proObj }

                    }).then((response) => {
                        resolve()
                    })

                }

            } else {
                let cartObj = {
                    user: objId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: function (userId) {
        console.log('Mongo',userId);
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objId(userId) })
            if (userCart) {
                console.log('Cart is teher');
                let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    
                ]).toArray()

                resolve(cartItems)
            } else {
                console.log('No cart');
                reject()
            }

        })
    },
    getAllUsers: function () {
        return new Promise(async (resolve, reject) => {
            users = await db.get().collection(collection.USER_COLLECTION).find({ admin: false }).toArray()
            resolve(users)
        })
    },
    blockUser: function (proId) {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objId(proId) }, {
                $set: {
                    block: true
                }
            }).then(() => {
                resolve()
            })
        })
    },
    unblockUser: function (proId) {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objId(proId) }, {
                $set: {
                    block: false
                }
            }).then(() => {
                resolve()
            })
        })
    },
    getCartCount: function (userId) {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objId(userId) })
            if (cart) {
                count = cart.products.length

            }
            resolve(count)
        })
    },
    changeProductQuantity: function (details) {
        
        quantity = parseInt(details.quantity)
        count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objId(details.cart) },
                    {
                        $pull: { products: { item: objId(details.product) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })

            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objId(details.cart), 'products.item': objId(details.product) }, {
                    $inc: { 'products.$.quantity': count }
                }).then((response) => {


                    resolve({status:true})
                })
            }

        })
    },
    deleteOneCartItem: function (details) {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objId(details.cart) },
                {
                    $pull: { products: { item: objId(details.product) } }
                }).then((response) => {
                    resolve(true)
                })
        })
    },
    deleteCart: function (details) {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).removeOne({ user: objId(details.user) }).then((response) => {
                resolve(true)
            })
        })
    },
    otpSignup: function (userData) {
        console.log('MOngo part',userData);
        
        return new Promise(async (resolve, reject) => {
            
                db.get().collection(collection.USER_COLLECTION).insertOne({
                    name: userData.name,
                    mobile: userData.mobile,
                    email:userData.email,
                    admin: false,
                    block: false
                }).then(() => {
                    
                    resolve()
                })
            

        })
    },
    otpUserCheck:function(userData){
        
        return new Promise(async(resolve,reject)=>{
           let user=await db.get().collection(collection.USER_COLLECTION).findOne({mobile:userData.mobile})
           
           if(user){
               
                reject()
           }else{
               resolve()
           }
        })
    },
    otpEmailCheck:function(userData){
        
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                console.log('Existing user email');
                reject()
            }else{
                console.log('new user email');
                resolve()
            }
        })
    },

    otpLogin:function(userData){
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({mobile:userData.mobile})
            if(user.block){
                reject()
            }else{
                resolve(user)
            }
           
            
        })
    },
    getTotalAmount:function(userId){
        return new Promise(async (resolve, reject) => {
            
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    {
                        //use project instead of group for each product price
                        $group:{
                            _id:null,
                            total:{$sum:{$multiply:['$quantity','$product.productPrice']}}
                        }
                    }
                    
                ]).toArray()
               
                resolve(total[0].total)
            
        })
            
    },
    placeOrder:(order,products,total)=>{
        
        return new Promise((resolve,reject)=>{
            let status=order.payment_method==='cod'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    firstName:order.fname,
                    lastName:order.lname,
                    houseName:order.houseName,
                    streetAddress:order.streetAddress,
                    town:order.town,
                    state:order.state,
                    zip:order.zip,
                    phone:order.phone

                },
                userId:objId(order.user),
                paymentMethod:order.payment_method,
                totalAmount:total,
                products:products,
                status:status,
                date:new Date
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).removeOne({user:objId(order.user)})
                resolve()
            })

        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objId(userId)})
            resolve(cart.products)
        })
    },


}