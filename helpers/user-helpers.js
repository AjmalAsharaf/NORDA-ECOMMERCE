var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')

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
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

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
    }
}