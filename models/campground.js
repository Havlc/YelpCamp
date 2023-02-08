const mongoose = require("mongoose");

//SCHEMA SETUP
const campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    imageId: String,
    description: String,
    createdAt: {
            type: Date,
            default: Date.now
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

const Campground = mongoose.model("Campground", campgroundSchema);

module.exports = Campground;
