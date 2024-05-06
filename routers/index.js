const express = require("express");
// const v1Router = require("./v1");
// const v2Router = require("./v2");

const router = express.Router();

router.get("/", (_, res) => {
  res.send("Welcome to LAPI Laboratories eBatch Record API!");
});

// API versioning
// router.use("/v1", v1Router);
// router.use("/v2", v2Router);

module.exports = router;