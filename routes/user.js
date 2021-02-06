var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers');
const { response } = require('express');
var axios = require('axios');
var FormData = require('form-data');
const { Db } = require('mongodb');
const { getUserProfile, couponsCheck } = require('../helpers/user-helpers');




var otpid;

const verify=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/')
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.session.user) {

    if (req.session.admin) {
      res.redirect('/admin')
    } else {
      res.redirect('/user-home')
    }

  } else {
    productHelpers.viewAllProducts().then((products) => {
      res.render('users/index', { products });
    })


  }


});

router.get('/login-register', function (req, res) {
  if (req.session.user) {
    if (req.session.admin) {
      res.redirect('/admin')
    } else {


      res.redirect('/user-home')
    }

  } else {
    res.render('users/login-register')
  }

})
router.post('/register', (req, res) => {
  if (req.session.user) {

    if (req.session.admin) {
      res.redirect('/admin')
    } else {
      res.redirect('/user-home')
    }
  }
  else {
    userData = req.body
    userHelpers.doSignup(userData).then((response) => {

      res.json(response)
    }).catch((response) => {
      res.json(response)
    })

  }


})

router.post('/login', (req, res) => {

  if (req.session.user) {

    if (req.session.admin) {
      res.redirect('/admin')
    } else {
      res.redirect('/user-home')
    }
  } else {
    userData = req.body

    userHelpers.doLogin(userData).then((response) => {

      if (response.user.admin) {
        req.session.user = response.user
        req.session.admin = true
        res.json(response)
      } else {
        req.session.user = response.user
        res.json(response)
      }




    }).catch((response) => {

      res.json(response)
    })
  }




})
router.get('/user-home', (req, res) => {
  if (req.session.user) {

    if (req.session.admin) {
      res.redirect('/admin')
    } else {
      let user = req.session.user

      productHelpers.viewAllProducts().then((products) => {



        userHelpers.getCartProducts(req.session.user._id).then((cartProducts) => {

          userHelpers.getCartCount(req.session.user._id).then((cartCount) => {
            
            res.render('users/shop-no-sidebar', { products, user, cartProducts, cartCount })
          })

        }).catch(() => {
          
          res.render('users/shop-no-sidebar', { products, user })
        })





      })

    }


  } else {
    res.redirect('/')
  }


})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/view-cart', (req, res) => {
  if (req.session.user) {

    if (req.session.admin) {
      res.redirect('/admin')
    } else {


      user = req.session.user


      userHelpers.getCartProducts(req.session.user._id).then(async (products) => {

        if (products.length > 0) {
          let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
          
          res.render('users/cart', { user, products, totalValue })
        } else {
          res.render('users/cart', { user })
        }





      })

        .catch(() => {
          res.render('users/cart', { user })
        })





    }


  } else {
    res.redirect('/')
  }
})
router.get('/add-to-cart/:id', (req, res) => {
  if (req.session.user) {

    if (req.session.admin) {
      res.redirect('/admin')
    } else {
      proId = req.params.id

      userData = req.session.user
      userHelpers.getSingleUser(userData).then((userId) => {

        userHelpers.addToCart(proId, userId._id).then(() => {
          res.json({ status: true })
        })
      })

    }


  } else {
    res.redirect('/')
  }
})

router.post('/change-product-quantity',verify, (req, res) => {


  userHelpers.changeProductQuantity(req.body).then(async (response) => {

    response.singleTotal = await userHelpers.getSingeTotal(req.body.user, req.body.product)

    response.total = await userHelpers.getTotalAmount(req.body.user)


    res.json(response)
  })
})

router.post('/delete-one-cart',verify, (req, res) => {

  userHelpers.deleteOneCartItem(req.body).then((response) => {
    res.json(response)
  })
})

router.post('/delete-cart', verify,(req, res) => {

  userHelpers.deleteCart(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/otp', (req, res) => {
  if (req.session.user) {
    res.redirect('/user-home')
  } else {
    res.render('users/otp-register')

  }
})

router.post('/otp-register', (req, res) => {


  userHelpers.otpUserCheck(req.body).then(() => {
    userHelpers.otpEmailCheck(req.body).then(() => {

      var data = new FormData();




      data.append('mobile', +91 + req.body.mobile);
      data.append('sender_id', 'SMSINFO');
      data.append('message', 'Your otp code for registering {code}');
      data.append('expiry', '900');


      var config = {
        method: 'post',
        url: 'https://d7networks.com/api/verifier/send',
        headers: {
          'Authorization': 'Token b3b6ad053db9909cf29b8946712eeb1388acec39',
          ...data.getHeaders()
        },
        data: data
      };

      axios(config)
        .then(function (response) {

          otpid = response.data.otp_id
          res.json({ status: true })
        })
        .catch(function (error) {
          console.log(error);
        });
    }).catch(() => {
      res.json({ email: true })
    })

  })
    .catch(() => {

      res.json({ number: true })

    })



})

router.post('/verify-otp', (req, res) => {
  var data = new FormData();

  userData = req.body
  otpNumber = req.body.otp


  data.append('otp_id', otpid);
  data.append('otp_code', otpNumber);

  var config = {
    method: 'post',
    url: 'https://d7networks.com/api/verifier/verify',
    headers: {
      'Authorization': 'Token b3b6ad053db9909cf29b8946712eeb1388acec39',
      ...data.getHeaders()
    },
    data: data
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));

      if (response.data.status == 'success') {
        userHelpers.otpSignup(userData).then(() => {
          res.json({ status: true })
        })

      } else {
        res.json({ status: false })

      }

    })
    .catch(function (error) {
      console.log(error);
      res.json({ status: false })
    });

})

router.post('/resend-otp', (req, res) => {



  var data = new FormData();
  data.append('otp_id', otpid);

  var config = {
    method: 'post',
    url: 'https://d7networks.com/api/verifier/resend',
    headers: {
      'Authorization': 'Token b3b6ad053db9909cf29b8946712eeb1388acec39',
      ...data.getHeaders()
    },
    data: data
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      res.json({ status: true })
    })
    .catch(function (error) {
      console.log(error);
    });
})
/// write success code in catch here
router.post('/otp-login', (req, res) => {


  userHelpers.otpUserCheck(req.body).then(() => {
    res.json({ status: false })
  }).catch(() => {

    var data = new FormData();
    data.append('mobile', +91 + req.body.mobile);
    data.append('sender_id', 'SMSINFO');
    data.append('message', 'Your otp code is {code}');
    data.append('expiry', '900');

    var config = {
      method: 'post',
      url: 'https://d7networks.com/api/verifier/send',
      headers: {
        'Authorization': 'Token b3b6ad053db9909cf29b8946712eeb1388acec39',
        ...data.getHeaders()
      },
      data: data
    };

    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
        otpid = response.data.otp_id
        res.json({ status: true })
      })
      .catch(function (error) {
        console.log(error);
      });
  })
})

router.post('/otp-login-verify', (req, res) => {

  userData = req.body
  var data = new FormData();
  data.append('otp_id', otpid);
  data.append('otp_code', req.body.otp);

  var config = {
    method: 'post',
    url: 'https://d7networks.com/api/verifier/verify',
    headers: {
      'Authorization': 'Token b3b6ad053db9909cf29b8946712eeb1388acec39',
      ...data.getHeaders()
    },
    data: data
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      if (response.data.status == 'success') {
        userHelpers.otpLogin(req.body).then((user) => {
          req.session.user = user

          res.json({ status: true })
        }).catch(() => {
          res.json({ block: true })
        })

      } else {
        res.json({ status: false })

      }

    })
    .catch(function (error) {
      console.log(error);

      res.json({ status: false })
    });

})

router.get('/product-view/:id', verify,(req, res) => {
  let user = req.session.user

  productHelpers.viewOnePorduct(req.params.id).then((product) => {

    res.render('users/product-details', { product, user })
  })

})

router.get('/checkout', verify, async (req, res) => {
  userHelpers.getCartProducts(req.session.user._id).then(async (products) => {
    userHelpers.getAddress(req.session.user._id).then(async (address) => {
      console.log('address',address)
      let total = await userHelpers.getTotalAmount(req.session.user._id)
      res.render('users/checkout-with-address', { total, user: req.session.user, products, address })
    }).catch(async () => {
      let total = await userHelpers.getTotalAmount(req.session.user._id)
      res.render('users/checkout', { total, user: req.session.user, products })
    })

  })

})

router.post('/place-order',verify, async (req, res) => {
  console.log('place order', req.body);
  let products = await userHelpers.getCartProductList(req.body.user)
  let totalPrice = await userHelpers.getTotalAmount(req.body.user)
  
    let discound=parseInt(req.body.offerPrice)
    if(discound){
       totalPrice=totalPrice-discound
    }else{
      console.log('not a number');
    }
    

 
  console.log('total price',totalPrice,'offer',discound);
  
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body.payment_method == 'cod') {
      res.json({ codSuccess: true })
    }else if(req.body.payment_method=='paypal'){
      response.paypalTotal=totalPrice
      response.paypal=true
      res.json(response)
    }
    
    else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {

        res.json(response)
      })
    }

  })

})



router.get('/my-account',verify, (req, res) => {
  let user = req.session.user
  userHelpers.getUserOrders(req.session.user._id).then((orders) => {
   
    userHelpers.getAddress(req.session.user._id).then(async(address) => {

      let userProfile=await userHelpers.getUserProfile(req.session.user._id)
      console.log('user profile',userProfile);
      res.render('users/my-account', { orders, user, address,userProfile })
    }).catch(async() => {
      let userProfile=await userHelpers.getUserProfile(req.session.user._id)
      res.render('users/my-account', { orders, user,userProfile })
    })


  })

})

router.post('/verify-payment',verify, (req, res) => {

  userHelpers.verifyPayment(req.body).then(() => {

    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {

      res.json({ status: true })
    })
  }).catch(() => {

    res.json({ status: false })
  })
})

router.get('/userhome-category/:id', verify,(req, res) => {
  console.log('user home params', req.params.id);
  let user = req.session.user

  productHelpers.productFileter(req.params.id).then((products) => {



    userHelpers.getCartProducts(req.session.user._id).then((cartProducts) => {

      userHelpers.getCartCount(req.session.user._id).then((cartCount) => {
        res.render('users/shop-no-sidebar', { products, user, cartProducts, cartCount })
      })

    }).catch(() => {
      res.render('users/shop-no-sidebar', { products, user })
    })





  })
})

router.get('/search', (req, res) => {
  let user = req.session.user
  productHelpers.searchProduct(req.query.text).then((products) => {
    console.log('better', products);
    userHelpers.getCartProducts(req.session.user._id).then((cartProducts) => {

      userHelpers.getCartCount(req.session.user._id).then((cartCount) => {
        res.render('users/shop-no-sidebar', { products, user, cartProducts, cartCount })
      })

    }).catch(() => {
      res.render('users/shop-no-sidebar', { products, user })
    })

  }).catch(() => {
    res.redirect('/user-home')
  })

})

router.get('/add-address',verify,(req,res)=>{
  let user=req.session.user
  res.render('users/add-address',{user})
})

router.post('/add-address',verify,(req,res)=>{
  
  
  userHelpers.addAddress(req.body).then(()=>{
    res.redirect('/my-account')
  })
})

router.get('/edit-address/:id',verify,(req,res)=>{
  console.log('paramas',req.params.id);
  userHelpers.editOneaddress(req.params.id).then((address)=>{
    
    res.render('users/edit-address',{address})
  })
})

router.post('/edit-address',verify,(req,res)=>{
  console.log('put',req.body);
  userHelpers.updateAddress(req.body).then(()=>{
    res.redirect('/my-account')
  })

})

router.get('/cancel-order/:id',verify,(req,res)=>{
  
  userHelpers.cancelOrder(req.params.id).then(()=>{
      res.redirect('/my-account')
  })
})

router.post('/update-account',verify,(req,res)=>{
  
  userHelpers.updateUserProfile(req.body).then((response)=>{
    console.log('new data from update user',response)
    req.session.user=response.user
    res.json(response)
  }).catch((response)=>{
    console.log('router',response);
    res.json(response)
  })
})

router.post('/check-coupon',verify,(req,res)=>{
  console.log('coupon code',req.body);
  userHelpers.couponsCheck(req.body).then((coupon)=>{
    console.log('valid');
   
    res.json({coupon})
  }).catch(()=>{
    console.log('Not valid');
    
    res.json({status:false})
  })

})
module.exports = router;
