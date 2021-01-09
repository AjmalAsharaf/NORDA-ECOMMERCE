var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.admin){
    res.render('admin/admin',{admin:true})
  }else{
    res.redirect('/')
  }
 
});

module.exports = router;
