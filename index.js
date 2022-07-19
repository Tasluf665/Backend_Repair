const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const cors = require("cors");
const error = require("./middleware/error");

const address = require("./routes/address");
const agents = require("./routes/agents");
const technicians = require("./routes/technicians");
const users = require("./routes/users");
const auth = require("./routes/auth");

const app = express();

if (!config.get("jwtPrivateKey")) {
  console.error("FATAL ERROR: jwtPrivateKey is not define");
  process.exit(1);
}

if (!config.get("DB_PASSWORD")) {
  console.error("FATAL ERROR: DB_PASSWORD is not define");
  process.exit(1);
}

mongoose
  .connect(
    `mongodb+srv://Tasluf:${config.get(
      "DB_PASSWORD"
    )}@cluster0.gvcib.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => console.log("Connected with mongodb"))
  .catch((err) => console.log("Could not connect to mongodb", err));

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use("/api/address", address);
app.use("/api/agents", agents);
app.use("/api/technicians", technicians);
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use(error);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Listening on port ${port}...`));