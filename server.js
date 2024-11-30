const express = require('express');                         // Express framework for building the web server
const mongoose = require('mongoose');                       // MongoDB object modeling tool
const dotenv = require('dotenv');                           // Environment variable handling
const cookieparser = require('cookie-parser');              // Middleware to parse cookies

// Importing router and dbconfig (for database connection setup)
const router = require('./routes/user');
const connectMongoDB = require('./config/dbconfig');

const app = express();                                  // Initialize Express app
const PORT = process.env.PORT || 3001;                  // Setting up port from environment variables or default to 3001

dotenv.config();                // Configure dotenv to load environment variables from .env file
connectMongoDB();               //connect to mongodb database

app.use(express.json());        // Middleware to parse JSON request bodies (application/json)
app.use(cookieparser());        // Middleware to parse cookies (needed for handling JWT tokens stored in cookies)

app.use('/auth', router);       // Set up routes for '/auth' path (which uses the user routes from './routes/user')

app.get('/', (req, res) => {    // Home route to check if server is up and running
    res.send("Auth App");       // Simple message to confirm the server is running
})
// Wait for the database to connect before starting the server
mongoose.connection.once('open', () => {
    console.log("DB Connected");
    // Start the Express server after the database connection is established
    app.listen(PORT, () => {
        console.log("Server is running at the port", PORT);
    });    
});

// Error handling for database connection issues
mongoose.connection.on('error', (err) => {
    console.error("DB Connection Error:", err);
});
