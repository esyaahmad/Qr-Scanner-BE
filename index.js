require("dotenv").config();

const express = require("express");
const cors = require("cors");
const router = require('./routers/index')
const handleError = require("./middlewares/eror");
// const helmet = require("helmet");
// const errorHandler = require("./middlewares/errorHandler");

const PORT = process.env.PORT || 3000;

const app = express();
// app.disable("x-powered-by"); // to prevent the server from including the X-Powered-By header in its HTTP responses
app.use(cors()); // for cross origin
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.json()); // for parsing application/json
app.use(router); // for routers
app.use(handleError); // for error handling
// app.use(helmet()); // for security

// app.use(errorHandler); // for error handling

app.listen(PORT, () => {
  console.log(`LAPI EBatch Record app listening on PORT ${PORT}`);
});