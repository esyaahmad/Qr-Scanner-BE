const express = require("express");
const router = express.Router();
const MsqlController = require("../controllers/controller");

router.get("/", (req,res) => {
	res.send("Warehouse API")
})

router.get("/products/:ttba/:seqId/:vat", MsqlController.fetchProductByScanner);
router.get("/products/:DNc_no/:item_id", MsqlController.fetchProductByDncNoAndItemId);
router.get("/detailProd/:ttba/:seqId", MsqlController.fetchProductDetailByDncNoAndSeqIdAndVatQty);
// router.get("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.fetchRackByItemIDAndDNc_No);
router.get("/racks/:loc/:rak/:row/:col/:ttbaScanned", MsqlController.fetchRackByTtbaScanned);
router.get("/racks/:loc/:rak/:row/:col", MsqlController.fetchRackByLocation);
router.get("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No/:ttba_no", MsqlController.fetchRackByItemIDAndDNc_NoAndTtba_No);
router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.increaseQtyRackByLocItemIDDNcNo);
router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No/dec", MsqlController.decreaseQtyRackByLocItemIDDNcNo); 
router.post("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.insertProductToRack);
router.post("/moveRack/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.insertMoveProductToRack);

router.delete("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.deleteProductFromRack);
router.post("/racksDel/:loc/:rak/:row/:col/:Item_ID/:DNc_No/:ttbaScanned", MsqlController.deleteProductFromRackByTtbaScanned);

module.exports = router;