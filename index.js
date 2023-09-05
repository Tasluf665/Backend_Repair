// Import the Joi library for data validation. https://www.youtube.com/watch?v=u9kxYilQ9l8
const Joi = require("joi");
// Extend Joi to include validation for MongoDB ObjectIDs. Source: Mosh -> NodeJS course -> 9. Mongoose - Modeling -> 10 - Validating ObjectIDs
Joi.objectId = require("joi-objectid")(Joi);

const express = require("express"); // Express.js for creating the API server.
const mongoose = require("mongoose"); // Mongoose for MongoDB database connection.

// Body-parser for parsing request data. Source: https://www.youtube.com/watch?v=bQApV_RddO4
const bodyParser = require("body-parser");

// Load environment variables from a .env file using dotenv. Source: https://www.youtube.com/watch?v=zwcvXd3kGbw
require("dotenv").config();

// Config for configuration management. Source: Mosh -> NodeJS course -> 5. Express -> 7 - Configuration
const config = require("config");

// Cors for handling cross-origin resource sharing. Source: https://www.youtube.com/watch?v=PNtFSVU-YTI
const cors = require("cors");

// Error handling middleware. Source: Mosh -> NodeJS course -> 11. Handling -> 3- Express Error
const error = require("./middleware/error");

// Import route modules for the application.
const address = require("./routes/address"); // Routes for managing addresses.
const agents = require("./routes/agents"); // Routes for managing agents.
const technicians = require("./routes/technicians"); // Routes for managing technicians.
const users = require("./routes/users"); // Routes for managing users.
const auth = require("./routes/auth"); // Routes for authentication.
const orders = require("./routes/orders"); // Routes for managing orders.
const payments = require("./routes/payments"); // Routes for managing payments.
const products = require("./routes/products"); // Routes for managing products.

// Create an instance of the Express.js application and set the view engine to EJS.
const app = express(); // Initialize the Express application.

// Set the view engine to EJS for rendering views. Source: https://www.youtube.com/watch?v=rKje9taS8BA
app.set("view engine", "ejs");

// Check for the presence of critical configuration variables. Source: Mosh -> NodeJS course -> 5. Express -> 7 - Configuration and 10. Authentication -> 10- Storing Secrets
if (!config.get("jwtPrivateKey") || !config.get("DB_PASSWORD")) {
  console.error("FATAL ERROR: jwtPrivateKey or DB_PASSWORD is not define");
  process.exit(1);
}

// Connect to a MongoDB database using Mongoose.
mongoose
  .connect(
    `mongodb+srv://Tasluf:${config.get(
      "DB_PASSWORD"
    )}@cluster0.gvcib.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => console.log("Connected with MongoDB")) // Connection success message.
  .catch((err) => console.log("Could not connect to MongoDB", err)); // Connection error handling.

// Configure middleware for handling incoming requests and data parsing.
app.use(express.json()); // Parse JSON data in request bodies.
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data in request bodies.

// Serve static files from the "public" directory. Source: https://www.youtube.com/watch?v=nZakTwJZWV8
app.use(express.static(__dirname + "/public"));

// Parse JSON data in request bodies (deprecated). Source: https://www.youtube.com/watch?v=bQApV_RddO4
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data in request bodies (deprecated).

// Enable Cross-Origin Resource Sharing (CORS) for all origins. Source: https://www.youtube.com/watch?v=PNtFSVU-YTI
app.use(cors({ origin: "*" }));

// Define routes for different parts of the application.
app.use("/api/address", address); // Routes for managing addresses.
app.use("/api/agents", agents); // Routes for managing agents.
app.use("/api/technicians", technicians); // Routes for managing technicians.
app.use("/api/users", users); // Routes for managing users.
app.use("/api/auth", auth); // Routes for authentication.
app.use("/api/orders", orders); // Routes for managing orders.
app.use("/api/payments", payments); // Routes for managing payments.
app.use("/api/products", products); // Routes for managing products.

// Error handling middleware. Source: Mosh -> NodeJS course -> 11. Handling -> 3- Express Error
app.use(error);

// Define a test route to check if the API is working.
app.get("/test", (req, res) => {
  res.send("API is working");
});

// Configure the application to listen on a specified port or default to 3001.
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Listening on port ${port}...`));

module.exports = app;
