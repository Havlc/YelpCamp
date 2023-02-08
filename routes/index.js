const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Campground = require("../models/campground");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

//root route
router.get("/", (req,res)=>{
    res.render("landing");
});

//show register form
router.get("/register", (req,res)=>{
    res.render("register", {page: 'register'});
});

//handle sign up logic
router.post("/register", (req, res)=>{
    const newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    //admin password
    if(req.body.adminCode === "Admin"){
        newUser.isAdmin = true;
    }

    User.register(newUser, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, ()=>{
            req.flash("success", "Successfully Signed Up! Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//show login form
router.get("/login", (req, res)=>{
     res.render("login", {page: 'login'}); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), (req, res)=>{
});

// logout logic route
router.get("/logout", (req,res)=>{
    req.logout();
    req.flash("success", "Logged You out!");
    res.redirect("/campgrounds");
});

//forgot password
router.get("/forgot", (req, res)=>{
    res.render("forgot");
});

router.post("/forgot", (req, res, next)=>{
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, (err, buf)=>{
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) =>{
            User.findOne({email: req.body.email}, (err, user)=>{
            if(!user){
                req.flash('error', 'No account with that email address exists.');
                return res.redirect('forgot');
            }
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000 //1hour

            user.save((err)=>{
                done(err, token, user);
            });
        });
        },
        (token, user, done)=>{
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.GMAILUSER,
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: user.email,
                from: process.env.GMAILUSER,
                subject: 'Node.js Password Reset',
                        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, (err)=>{
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' witht further instructions.');
                done(err, 'done');
            });
        }
        ],  (err)=>{
            if(err) return next(err);
            res.redirect('/forgot');
        });
});

//reset

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.GMAILUSER,
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.GMAILUSER,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

//User profile
router.get("/users/:id", (req, res)=>{
    User.findById(req.params.id, (err, foundUser)=>{

        if(err){
          req.flash("error", "Something went wrong.");
          return res.redirect("/");
        }
        Campground.find().where('author.id').equals(foundUser._id).exec((err, campgrounds)=>{
        if(err){
          req.flash("error", "Something went wrong.");
          return res.redirect("/");
        }
        res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        })
    });
});

module.exports = router;