const express = require("express");
const router = express.Router();
const MsqlController = require("../controllers/controller");
const { authentication } = require("../middlewares/authentication");

router.get("/", (req,res) => {
	res.send("Warehouse API")
})

router.get("/products/:ttba/:seqId/:vat", authentication ,MsqlController.fetchProductByScanner); //untuk fecth prod insert prod sementara di Scanner.jsx
router.get("/productsPerTtba/:ttba/:seqId/:vat", authentication, MsqlController.fetchProductByScannerPerTtba); // untuk fecth prod bulk insert prod sementara
router.get("/productsPerVat/:ttba/:seqId/:vat", authentication, MsqlController.fetchProductByScannerPerVat); // untuk fecth prod withdraw prod pervat sesuai scanner di withdrawTimbang
router.get("/productsByTtbaAndStockPosition/:ttba/:seqId/:vat", authentication, MsqlController.fetchProductByScannerPerVatAndStockPosition); // fetch prod di modalswaprack dan insertTimbang
router.get("/productsByTtba/:DNc_no/:item_id/:ttba", MsqlController.fetchProductByTtbaScanned); // fetch prod di modalswaprack
router.get("/detailProd/:ttba/:seqId", MsqlController.fetchProductDetailByDncNoAndSeqIdAndVatQty); // fetch postgre di scanner.jsx
// router.get("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.fetchRackByItemIDAndDNc_No);
router.get("/racks/:loc/:rak/:row/:col/:ttbaScanned", authentication, MsqlController.fetchRackByTtbaScanned); //fetchRack di scanner, insertTimbang, modalswaprack
router.get("/racks/:loc/:rak/:row/:col", authentication, MsqlController.fetchRackByLocation); //fetch isi rack1 di scannerRack.jsx
router.get("/racksByProductDncNo/:DNc_No", MsqlController.fetchRackByProductTtba); //fetch isi rack cek rak
router.get("/rackProdByTtba/:ttbaScanned", authentication, MsqlController.fetchRackProductByTtbaScanned); //fetch isi rack by scanned di withdrawSampling
router.get("/getAllGudangProducts", MsqlController.fetchAllStockGudang); //fetch isi rack by scanned
router.get("/timbangList/:id", MsqlController.fetchTimbangById); //fetch timbang di TimbangPage.jsx
router.post("/racksByArrTtba/:loc/:rak/:row/:col", MsqlController.fetchRackByArrTtba); //fetch isi rack di scannerRack

// router.get("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No/:ttba_no", MsqlController.fetchRackByItemIDAndDNc_NoAndTtba_No); // ga kepake  
router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", authentication, MsqlController.increaseQtyRackByLocItemIDDNcNo);// fetch rackInto di modalswaprack
router.patch("/decRackQty/:loc/:rak/:row/:col/:ttbaScanned", authentication, MsqlController.decreaseQtyRackByLocItemIDDNcNo); // patch di withdrawSampling
router.patch("/validateTimbang/:DNcTimbang/:ItemIdTimbang", authentication, MsqlController.patchValidateTimbang); // patch di modalswaptimbang
router.patch("/doneTimbang/:DNcTimbang/:ItemIdTimbang/:noVatTimbang", authentication, MsqlController.patchWithdrawStockKecil); // patch di TimbangPage
router.post("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", authentication ,MsqlController.insertProductToRack); // post handleCreate Scanner.jsx
router.post("/moveRack/:loc/:rak/:row/:col/:Item_ID/:DNc_No", authentication, MsqlController.insertMoveProductToRack); // create di modwalSwaoRack
router.post("/racks/:loc/:rak/:row/:col", authentication, MsqlController.insertBulkProductToRack);
router.delete("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", MsqlController.deleteProductFromRack);
router.post("/racksDel/:loc/:rak/:row/:col/:Item_ID/:DNc_No/:ttbaScanned", authentication, MsqlController.deleteProductFromRackByTtbaScanned); // delete di modalswaprack
router.post("/rakDelByTtba/:ttbaScanned", authentication, MsqlController.deletePemetaanByTtba);// di withdrawTimbang
router.post("/stockPosToRack/:loc/:rak/:row/:col/:ttbaScanned", authentication, MsqlController.insertTimbangToGudang); //di InsertTImbang


router.post("/stockPosition/:DNc_No/:vat_no", authentication, MsqlController.insertStockPosition);	// di withdrawTimbang
module.exports = router;