const express = require("express");
const router = express.Router();
const MsqlController = require("../controllers/controller");

router.get("/", (req,res) => {
	res.send("Warehouse API")
})

router.get("/products/:ttba/:seqId/:vat", MsqlController.fetchProductByScanner); //untuk fecth prod insert prod sementara
router.get("/productsPerTtba/:ttba/:seqId/:vat", MsqlController.fetchProductByScannerPerTtba); // untuk fecth prod bulk insert prod sementara
router.get("/productsPerVat/:ttba/:seqId/:vat", MsqlController.fetchProductByScannerPerVat); // untuk fecth prod withdraw prod pervat sesuai scanner
router.get("/productsByTtbaAndStockPosition/:ttba/:seqId/:vat", MsqlController.fetchProductByScannerPerVatAndStockPosition); // fetch prod di modalswaprack
router.get("/productsByTtba/:DNc_no/:item_id/:ttba", MsqlController.fetchProductByTtbaScanned); // fetch prod di modalswaprack
router.get("/detailProd/:ttba/:seqId", MsqlController.fetchProductDetailByDncNoAndSeqIdAndVatQty); // fetch postgre di scanner
// router.get("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.fetchRackByItemIDAndDNc_No);
router.get("/racks/:loc/:rak/:row/:col/:ttbaScanned", MsqlController.fetchRackByTtbaScanned); //fetchRack di scanner
router.get("/racks/:loc/:rak/:row/:col", MsqlController.fetchRackByLocation); //fetch isi rack di scannerRack
router.get("/racksByProductDncNo/:DNc_No", MsqlController.fetchRackByProductTtba); //fetch isi rack cek rak
router.get("/rackProdByTtba/:ttbaScanned", MsqlController.fetchRackProductByTtbaScanned); //fetch isi rack by scanned
router.get("/getAllGudangProducts", MsqlController.fetchAllStockGudang); //fetch isi rack by scanned

router.post("/racksByArrTtba/:loc/:rak/:row/:col", MsqlController.fetchRackByArrTtba); //fetch isi rack di scannerRack

// router.get("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No/:ttba_no", MsqlController.fetchRackByItemIDAndDNc_NoAndTtba_No); // ga kepake
router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.increaseQtyRackByLocItemIDDNcNo);// fetch rackInto di modalswaprack
router.patch("/decRackQty/:loc/:rak/:row/:col/:ttbaScanned", MsqlController.decreaseQtyRackByLocItemIDDNcNo); 
router.post("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.insertProductToRack);
router.post("/moveRack/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.insertMoveProductToRack);
router.post("/racks/:loc/:rak/:row/:col", MsqlController.insertBulkProductToRack);
router.delete("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.deleteProductFromRack);
router.post("/racksDel/:loc/:rak/:row/:col/:Item_ID/:DNc_No/:ttbaScanned", MsqlController.deleteProductFromRackByTtbaScanned);
router.post("/rakDelByTtba/:ttbaScanned", MsqlController.deletePemetaanByTtba);
router.post("/stockPosToRack/:loc/:rak/:row/:col/:ttbaScanned", MsqlController.insertTimbangToGudang);


router.post("/stockPosition/:DNc_No/:vat_no", MsqlController.insertStockPosition);	
module.exports = router;