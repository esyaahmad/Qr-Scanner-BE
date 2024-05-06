require("dotenv").config();

const express = require("express");
const cors = require("cors");
// const helmet = require("helmet");
const routersMssql = require("./routers/connectionMssql");
// const errorHandler = require("./middlewares/errorHandler");

const PORT = process.env.PORT || 3000;

const app = express();
// app.disable("x-powered-by"); // to prevent the server from including the X-Powered-By header in its HTTP responses
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.json()); // for parsing application/json
// app.use(helmet()); // for security
app.use(cors()); // for cross origin

app.use(routersMssql); // for routers
// app.use(errorHandler); // for error handling

app.listen(PORT, () => {
  console.log(`LAPI EBatch Record app listening on PORT ${PORT}`);
});