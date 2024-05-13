const express = require("express");
const router = express.Router();
const MsqlController = require("../controllers/controller");

router.get("/", (req,res) => {
	res.send("Warehouse API")
})

router.get("/products/:ttba/:a/:b/:c/:d/:e/:f", MsqlController.fetchProductByScanner);
router.get("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.fetchRackByItemIDAndDNc_No);
router.get("/racks/:loc/:rak/:row/:col", MsqlController.fetchRackByLocation);
router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.increaseQtyRackByLocItemIDDNcNo);
router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No/dec", MsqlController.decreaseQtyRackByLocItemIDDNcNo); 
router.post("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.insertProductToRack);
router.delete("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.deleteProductFromRack);
module.exports = router;