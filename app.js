const   express        = require("express"),
        app            = express(),
        bodyParser     = require("body-parser"),
        mongoose       = require("mongoose"),
        passport       = require("passport"),
        flash          = require("connect-flash"),
        Campground     = require("./models/campground"),
        Comment        = require("./models/comment"),
        User           = require("./models/user"),
        LocalStrategy  = require("passport-local"),
        seedDB         = require("./seeds"),
        methodOverride = require("method-override");

// configure dotenv
require('dotenv').config();

//requirung routes    
const   commentRoutes    = require("./routes/comments"),
        campgroundRoutes = require("./routes/campgrounds"),
        indexRoutes      = require("./routes/index");

//const url = process.env.DATABASEURL || "mongodb://localhost:27017/yelp_camp_v12"
//mongoose.connect(url,{useNewUrlParser:true});

//mongoose.connect(process.env.DATABASEURL);
const MONGODB_URI = process.env.MONGODB_URI
//mongoose.connect("mongodb://localhost:27017/yelp_camp_v12",{useNewUrlParser:true});
mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useCreateIndex: true
}).then(() => {
    console.log("Connected to DB!");
}).catch(err => {
    console.log("ERROR", err.message);
});


mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB(); // seed the database

// Passport configuration
app.use(require("express-session")({
    secret: "This is a secret message of this page",
    resave: false,
    saveUninitialized: false
}));

app.locals.moment = require('moment');
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(process.env.PORT, function(){
    console.log("The YelpCamp server has started");
});