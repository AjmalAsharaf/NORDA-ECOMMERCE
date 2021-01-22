var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers');
const { response } = require('express');
var axios = require('axios');
var FormData = require('form-data');


var otpid;

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
      console.log(response);
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
      let userData = req.session.user

      productHelpers.viewAllProducts().then((products) => {
        userHelpers.getSingleUser(userData).then(async (user) => {


          userHelpers.getCartProducts(user._id).then((cartProducts) => {

            userHelpers.getCartCount(user._id).then((cartCount) => {
              res.render('users/shop-no-sidebar', { products, user, cartProducts, cartCount })
            })

          }).catch(() => {
            res.render('users/shop-no-sidebar', { products, user })
          })


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
      console.log('user name', user);

      userHelpers.getCartProducts(req.session.user._id).then(async (products) => {
        let totalValue = await userHelpers.getTotalAmount(req.session.user._id)

        res.render('users/cart', { user, products, totalValue })
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

router.post('/change-product-quantity', (req, res) => {


  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    
    response.total = await userHelpers.getTotalAmount(req.body.user)
    console.log('Response', response);
    res.json(response)
  })
})

router.post('/delete-one-cart', (req, res) => {
  console.log('______________delete', req.body);
  userHelpers.deleteOneCartItem(req.body).then((response) => {
    res.json(response)
  })
})

router.post('/delete-cart', (req, res) => {
  console.log('SErver', req.body);
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

  console.log('Otp register body', req.body);
  userHelpers.otpUserCheck(req.body).then(() => {
    userHelpers.otpEmailCheck(req.body).then(() => {
      console.log('New user');
      var data = new FormData();

      console.log(req.body.mobile);


      data.append('mobile', +91 + req.body.mobile);
      data.append('sender_id', 'SMSINFO');
      data.append('message', 'Your otp code for registering {code}');
      data.append('expiry', '900');


      var config = {
        method: 'post',
        url: 'https://d7networks.com/api/verifier/send',
        headers: {
          'Authorization': 'Token 6006332f15b6afb6c2a4b9527f3e21fe63dd41fa',
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
      console.log('Existing user');
      res.json({ number: true })

    })



})

router.post('/verify-otp', (req, res) => {
  var data = new FormData();
  console.log('Alll data in verify login', req.body);
  userData = req.body
  otpNumber = req.body.otp


  data.append('otp_id', otpid);
  data.append('otp_code', otpNumber);

  var config = {
    method: 'post',
    url: 'https://d7networks.com/api/verifier/verify',
    headers: {
      'Authorization': 'Token 6006332f15b6afb6c2a4b9527f3e21fe63dd41fa',
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

  console.log('Iam here and Otp id is,', otpid);

  var data = new FormData();
  data.append('otp_id', otpid);

  var config = {
    method: 'post',
    url: 'https://d7networks.com/api/verifier/resend',
    headers: {
      'Authorization': 'Token 6006332f15b6afb6c2a4b9527f3e21fe63dd41fa',
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
  console.log('MObile number in otp-login route', req.body.mobile);

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
        'Authorization': 'Token 6006332f15b6afb6c2a4b9527f3e21fe63dd41fa',
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
  console.log('Otp in verify', req.body);
  userData = req.body
  var data = new FormData();
  data.append('otp_id', otpid);
  data.append('otp_code', req.body.otp);

  var config = {
    method: 'post',
    url: 'https://d7networks.com/api/verifier/verify',
    headers: {
      'Authorization': 'Token 6006332f15b6afb6c2a4b9527f3e21fe63dd41fa',
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
          console.log('Session User', req.session.user);
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

router.get('/product-view/:id', (req, res) => {
  console.log('Product view id', req.params.id);
  productHelpers.viewOnePorduct(req.params.id).then((product) => {
    console.log('Recieved product', product);
    res.render('users/product-details', { product })
  })

})

router.get('/checkout', async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('users/checkout', { total,user:req.session.user })
})

router.post('/place-order',async(req,res)=>{
  console.log('Req',req.body);
  let products=await userHelpers.getCartProductList(req.body.user)
  let totalPrice=await userHelpers.getTotalAmount(req.body.user)
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
    res.json({status:true})
  })
  
})

router.get('/my-account',(req,res)=>{
  res.render('users/my-account')
})
module.exports = router;
