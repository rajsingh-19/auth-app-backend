const express = require('express');         // Express framework to build the server
const bcrypt = require('bcrypt');           // Bcrypt for hashing passwords
const jwt = require('jsonwebtoken');        // JSON Web Token library for creating and verifying tokens
const router = express.Router();            // Express router to define route handlers
const dotenv = require('dotenv');           // To load environment variables from a .env file
// Import the User model for database interaction
const UserModel = require('../models/userschema');
dotenv.config();                            // Load environment variables from .env file

//          register route
router.post('/register', async (req, res) => {
    const {username, email, password} = req.body;                         // Extract user data from the request body
    const user = await UserModel.findOne({email});                        // search if the user's email is already present then return an error
    if(user) {
        return res.status(400).json({message: "user already exists"});
    }    
    // Hash the password using bcrypt
    const salting = await bcrypt.genSalt(10);                               // Generate a salt for password hashing
    const hashPassword = await bcrypt.hash(password, salting);              // Hash the password with the salt

    // create the new user in the user model
    const newUser = new UserModel({
        username,
        email,
        password: hashPassword
    });
    // Save the new user to the database
    await newUser.save();                                                    // Save the new user to the model (MongoDB)
    return res.json({status: true, message: "User Created"});
});

//          login route
router.post('/login', async(req, res) => {
    const {email, password} = req.body;                                         // Extract email and password from the request body
    // Find the user by email
    const user = await UserModel.findOne({email});
    if(!user) {
        return res.status(404).json({message: "User not found"});
    }
    // Compare the entered password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid) {
        return res.status(404).json({message: "credential is wrong"});
    }
    // Payload for the JWT token (information we want to encode into the token)
    const payload = {
        email: user.email                // Include email in the token payload
    }
    // Create the JWT token with the payload, using a secret key from environment variables
    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '50w'});            // Token expires in 50 weeks
    // Store the token in a cookie named "token"
    res.cookie("token", token);
    return res.json({status: true, message: "Login Succcesfully", token:token});
});
//              Middleware to verify user authentication
const verifyUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;                                    // Get the token from the cookies
        if(!token) {
            return res.json({status: false, message: "Auth Failed"});
        }
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Store the decoded information (user data) in the request object
        req.user = decoded;
        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.log(err);
    }
};

// Profile route - Only accessible if the user is authenticated
router.get('/profile', verifyUser, (req, res) => {
    console.log(req.user);                          // Log the user object from the decoded token
    res.json({message: "Profile"});                 // Respond with profile information (for now just a message)
});
// Dashboard route - Only accessible if the user is authenticated
router.get('/dashboard', verifyUser, (req, res) => {
    res.json({message: "Hello dashboard"});         // Respond with a message for the dashboard
});

//          logout route
router.post('/logout', (req, res) => {
    res.clearCookie("token");                           // Clear the token stored in the cookie to log the user out
    res.json({message: "Logout Successfully"});
});

module.exports = router;
