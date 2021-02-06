var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const orderHelpers = require('../helpers/order-helpers');
const { response } = require('express');
var voucher_codes = require('voucher-code-generator');
/* GET users listing. */

const verifyAdmin=(req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.redirect('/')
  }
}



router.get('/', function (req, res, next) {
  if (req.session.admin) {
    


    orderHelpers.getTotalOrderNum().then((orderNum) => {
      orderHelpers.graphStatus().then((response) => {
        res.render('admin/admin', { admin: true, orderNum, response })
      })

    }).catch(() => {
      res.render('admin/admin', { admin: true })

    })

  } else {
    res.redirect('/')
  }

});

router.get('/user-management', function (req, res) {
  if (req.session.admin) {
    userHelpers.getAllUsers().then((userDetails) => {
      console.log('All users', userDetails);
      res.render('admin/user-management', { admin: true, userDetails })
    })

  } else {
    res.redirect('/')
  }
})

router.get('/product-management', function (req, res) {
  if (req.session.admin) {
    productHelpers.viewAllProducts().then((products) => {
      console.log('products',products)
      res.render('admin/product-management', { admin: true, products })
    })

  } else {
    res.redirect('/')
  }
})

router.get('/add-product', (req, res) => {
  if (req.session.admin) {
    productHelpers.showCategory().then((category) => {
      
      res.render('admin/add-product', { admin: true, category })
    })

  } else {
    res.redirect('/')
  }
})

router.post('/add-product', (req, res) => {
  if (req.session.admin) {

    productHelpers.addProducts(req.body).then((id) => {
      console.log(id+0)
      let image = req.files.Image
      let image2=req.files.Image0
      console.log('images',image, 'second image',image2);
      image.mv('./assets/product-images/' + id + '.jpg')
      image2.mv('./assets/product-images/' + id+'0' + '.jpg')
      res.redirect('/admin/product-management')
    })
  } else {
    res.redirect('/')
  }
})

router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id

  if (req.session.admin) {
    productHelpers.deleteProduct(proId).then(() => {
      res.redirect('/admin/product-management')
    })
  } else {
    res.redirect('/')
  }
})

router.get('/edit-product/:id', (req, res) => {
  let proId = req.params.id

  if (req.session.admin) {
    productHelpers.viewOnePorduct(proId).then((product) => {
      productHelpers.showCategory().then((category) => {
        res.render('admin/edit-product', { admin: true, product, category })
      })

    })
  } else {
    res.redirect('/')
  }
})

router.post('/update-product/:id', (req, res) => {
  let proId = req.params.id
  if (req.session.admin) {
    product = req.body
    productHelpers.updateProduct(proId, product).then(() => {
      res.redirect('/admin/product-management')
      if (req.files.Image) {
        image = req.files.Image
        image.mv('./assets/product-images/' + proId + '.jpg', (err, done) => {

        })


      }
      if(req.files.Image0){
        image1=req.files.Image0
        image1.mv('./assets/product-images/' + proId+'0' + '.jpg')
      }



    })

  } else {
    res.redirect('/')
  }
})

router.get('/block-user/:id', (req, res) => {
  if (req.session.admin) {
    proId = req.params.id
    userHelpers.blockUser(proId).then(() => {
      res.redirect('/admin/user-management')
    })

  } else {
    res.redirect('/')
  }

})
router.get('/unblock-user/:id', (req, res) => {
  if (req.session.admin) {
    proId = req.params.id
    userHelpers.unblockUser(proId).then(() => {
      res.redirect('/admin/user-management')
    })
  } else {
    res.redirect('/')
  }
})

router.get('/add-category', (req, res) => {
  if (req.session.user) {
    res.render('admin/add-category', ({ admin: true }))
  } else {
    res.redirect('/')
  }

})
router.post('/add-category', (req, res) => {
  console.log(req.body, 'add-category');
  if (req.session.admin) {

    productHelpers.insertCategory(req.body).then(() => {
      res.json({ status: true })
    }).catch(() => {
      res.json({ status: false })
    })
  } else {
    res.redirect('/')
  }

})
router.get('/category-management', (req, res) => {
  if (req.session.admin) {
    productHelpers.showCategory().then((category) => {
      res.render('admin/category-manager', { admin: true, category })
    })
  } else {
    res.redirect('/')
  }


})

router.get('/delete-category/:id', (req, res) => {
  
  if (req.session.admin) {
    
    proId = req.params.id
    productHelpers.deleteCategory(proId).then(() => {
      res.redirect('/admin/category-management')
    })
  } else {
    res.redirect('/')
  }

})

router.get('/edit-category/:id', (req, res) => {
  if (req.session.admin) {
    proId = req.params.id

    productHelpers.showOneCategory(proId).then((category) => {
      res.render('admin/edit-category', { admin: true, category })
    })
  } else {
    res.redirect('/')
  }

})

router.post('/edit-category', (req, res) => {
  if (req.session.admin) {
    productHelpers.updateCategory(req.body.proId, req.body.productSubCat).then(() => {
      res.json({ status: true })
    })
      .catch(() => {
        res.json({ status: false })
      })
  } else {
    res.redirect('/')
  }

})
router.get('/get-all-orders',verifyAdmin, (req, res) => {
  userHelpers.getAllOrders().then((allorders) => {

    res.render('admin/order-details', { admin: true, allorders })
  })
})

router.get('/cancel-order/:id', verifyAdmin,(req, res) => {
  console.log('cancel', req.params.id);
  userHelpers.cancelOrder(req.params.id).then(() => {
    res.redirect('/admin/get-all-orders')
  })
})

router.get('/ship-order/:id', verifyAdmin,(req, res) => {
  userHelpers.shipOrder(req.params.id).then(() => {
    res.redirect('/admin/get-all-orders')
  })
})

router.get('/report', verifyAdmin,(req, res) => {

  res.render('admin/report', { admin: true })
})

// router.post('/report',(req,res)=>{
//   console.log('hi');
//       console.log('body date',req.body);
//       orderHelpers.getReports(req.body).then((response)=>{
//         res.json(response)
//       })
// })

router.get('/report-date',verifyAdmin, (req, res) => {
  console.log('params', req.query);
  orderHelpers.getReports(req.query).then((report) => {
    console.log('Response', report);
    if (report.length > 0) {
      res.render('admin/report', { admin: true, report })
    } else {
      res.redirect('/admin/report')
    }

  })
})

router.get('/offer',verifyAdmin, (req, res) => {
  productHelpers.viewAllProducts().then((products) => {



    res.render('admin/offer', { admin: true, products })
  })
})

router.get('/add-offer/:id',verifyAdmin, (req, res) => {
  productHelpers.viewOnePorduct(req.params.id).then((singleProduct)=>{
    console.log('products',singleProduct);
    res.render('admin/add-offer-item',{admin:true,singleProduct})
  })
})

router.post('/update-offer/:id',verifyAdmin,(req,res)=>{
  proId=req.params.id
  console.log('id',proId,'offer',req.body);
  productHelpers.updateOffer(proId,req.body).then(()=>{
    res.redirect('/admin/offer')
  })
})

router.get('/delete-offer/:id',verifyAdmin,(req,res)=>{
  proId=req.params.id
  productHelpers.removeOffer(proId).then(()=>{
    res.redirect('/admin/offer')
  })
})

router.get('/allCategory-offer',verifyAdmin,(req,res)=>{
  productHelpers.showCategory().then((categories)=>{
    console.log('categories',categories);
    res.render('admin/offer-to-category',{admin:true,categories})
  })
  
})

router.get('/add-category-offer/:id',verifyAdmin,(req,res)=>{
  productHelpers.showOneCategory(req.params.id).then((singleCategory)=>{
    console.log('category single',singleCategory);
    res.render('admin/offer-to-category-update',{singleCategory,admin:true})
    
  })
})

router.post('/add-category-offer/:id',verifyAdmin,(req,res)=>{
  console.log('params',req.params.id,'bo',req.body);
  proId=req.params.id
  productHelpers.updateCategoryOffer(proId,req.body).then(()=>{
    res.redirect('/admin/allCategory-offer')
  })
})

router.get('/coupon',verifyAdmin,(req,res)=>{
  userHelpers.getAllCoupons().then((coupons)=>{
    console.log('all coupons',coupons);
    res.render('admin/coupon',{admin:true,coupons})
  })
  
})

router.get('/generate-code-form',verifyAdmin,(req,res)=>{
  res.render('admin/coupon-form',{admin:true})
})
router.post('/generate-code',(req,res)=>{
  console.log('hi generate');
  let generateCode=voucher_codes.generate({
    length:8,
    count:5
  })
  console.log(generateCode[0]);
  console.log('reqbody',req.body);
  userHelpers.saveCoupen(generateCode[0],req.body).then(()=>{
    res.redirect('/admin/coupon')
  })
})

router.get('/delete-coupon/:id',verifyAdmin,(req,res)=>{
  proId=req.params.id

  userHelpers.deleteCoupon(proId).then(()=>{
    res.redirect('/admin/coupon')
  })
  
})

router.get('/delete-category-offer/:id',verifyAdmin,(req,res)=>{
  console.log('id here',req.params.id)
  productHelpers.removeCategoryOffer(req.params.id).then(()=>{
    res.redirect('/admin/allCategory-offer')
  })
})


module.exports = router;
