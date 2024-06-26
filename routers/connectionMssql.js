// const express = require("express");
// const router = express.Router();

// // MS SQL
// const sql = require("mssql");

// const config = {
//   user: process.env.MS_SQL_DB_USER,
//   password: process.env.MS_SQL_DB_PWD,
//   server: process.env.MS_SQL_DB_SERVER,
//   database: process.env.MS_SQL_DB_NAME,
//   options: {
//     encrypt: false,
//     trustServerCertificate: true,
//   },
// };

// // MS SQL API

// // get products by scanner
// router.get("/products/:ttba/:a/:b/:c/:d/:e/:f", async (req, res) => {
//   const data = req.params;
//   // console.log(req.params);
//   const ttba = Object.values(data).join("/");
//   // console.log(ttba);

//   sql.connect(config, function (err) {
//     if (err) console.log(err);
//     const request = new sql.Request();
//     request.query(
//       `select   A.TTBA_No,A.TTBA_SeqID,   a.ttba_itemid, case when c.item_type = 'BB' then '' else f.group_name end as group_name \
//       , c.item_name, a.ttba_batchno, e.prc_name, d.po_suppname, b.ttba_date, a.ttba_qty, a.ttba_itemUnit \
//        , isnull(a.ttba_prcid,'') as ttba_prcid, isnull(a.ttba_suppid,'') as ttba_suppid, isnull(a.ttba_itemrevision,'') as ttba_itemrevision , A.TTBA_SourceDocNo, A.TTBA_DNcNo as [No_analisa]  \
//         , convert(varchar(12),A.TTBA_RetestDate,106) as best_before \
//         , convert(varchar(12),TTBA_ExpDate,106) as Tgl_daluarsa  from  t_ttba_manufacturing_detail a \
//        inner join t_ttba_manufacturing_header b on a.ttba_no = b.ttba_no \
//        left join m_item_manufacturing c on a.ttba_itemid = c.item_id \
//        left join (select distinct aa.po_no, bb.po_suppname from t_po_manufacturing_detail aa \
//        left join t_po_manufacturing_header bb on aa.po_no = bb.po_no) d on a.ttba_sourcedocno = d.po_no \
//        left join m_principle e on a.ttba_prcid = e.prc_id \
//        left join m_item_group f on c.item_group = f.group_id \
//        left join t_TTBA_Manufacturing_Status G on G.TTBA_No = A.TTBA_No \
//        left join t_dnc_manufacturing as I on I.DNc_No = a.TTBA_DNcNo \
//        where a.ttba_no = '${ttba}' and G.TTBA_No is not null  \
//        order by a.ttba_seqid;`,
//       async function (err, { recordset }) {
//         if (err) console.log(err);
//         res.send(recordset);
//       }
//     );
//   });
// });

// // get RACK by ItemID and DNc_No
// router.get("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", async (req, res) => {
//   const { loc,rak,row,col} = req.params;
//   const formatItem_ID = req.params.Item_ID.replace(/_/g, ' ');
//   const formatDNc_No = req.params.DNc_No.replace(/-/g, '\/')

//   // console.log(req.params);
//   // console.log(formatItem_ID, formatDNc_No);

//   sql.connect(config, function (err) {
//     if (err) console.log(err);
//     const request = new sql.Request();
//     request.query(
//       `SELECT * FROM t_pemetaan_gudang
//       WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`,
//       async function (err, { recordset }) {
//         if (err) console.log(err);
//         res.send(recordset);
//       }
//     );
//   });
// });

// // GET rack by location
// router.get("/racks/:loc/:rak/:row/:col", async (req, res) => {
//   const { loc, rak, row, col } = req.params;

//   sql.connect(config, function (err) {
//     if (err) console.log(err);
//     const request = new sql.Request();
//     request.query(
//       `SELECT * FROM t_pemetaan_gudang
//       WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}';`,
//       async function (err, { recordset }) {
//         if (err) console.log(err);
//         res.send(recordset);
//       }
//     );
//   });
// });


// // get product by id
// // router.get("/products/:id", async (req, res) => {
// //   const { id } = req.params;

// //   sql.connect(config, function (err) {
// //     if (err) console.log(err);
// //     const request = new sql.Request();
// //     request.input("Product_ID", sql.NVarChar(50), id).query(
// //       "SELECT Product_ID, Product_Name, Product_Unit, \
// //               Product_Sediaan, Product_Location, Product_GroupSediaan, \
// //               Product_Kemasan, Product_Owner FROM m_product \
// //        WHERE Product_ID = @Product_ID;",
// //       async function (err, { recordset }) {
// //         if (err) console.log(err);
// //         res.send(recordset[0]);
// //       }
// //     );
// //   });
// // });

// //patch racks
// router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", async (req, res) => {
//   const { loc, rak, row, col } = req.params;
//   const formatItem_ID = req.params.Item_ID.replace(/_/g, ' ');
//   const formatDNc_No = req.params.DNc_No.replace(/-/g, '\/')
//   const { newQty } = req.body; // Assuming the new quantity is sent in the request body

//   console.log(req.body);
//   sql.connect(config, function (err) {
//     if (err) {
//       console.log(err);
//       return res.status(500).send("Internal Server Error");
//     }

//     const request = new sql.Request();
//     request.query(
//       `UPDATE t_pemetaan_gudang 
//        SET Qty = Qty + ${newQty}
//        WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`,
//       async function (err, result) {
//         if (err) {
//           console.log(err);
//           return res.status(500).send("Failed to update quantity");
//         }

//         if (result.rowsAffected[0] === 0) {
//           return res.status(404).send("No matching records found");
//         }

//         res.status(200).send("Quantity updated successfully");
//       }
//     );
//   });
// });

// //add racks
// router.post("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", async (req, res) => {
//   const { loc, rak, row, col} = req.params;
//   const formatItem_ID = req.params.Item_ID.replace(/_/g, ' ');
//   const formatDNc_No = req.params.DNc_No.replace(/-/g, '\/')
//   const { newQty, Process_Date, Item_Name } = req.body; // Assuming the new quantity is sent in the request body

//   console.log(req.body, "ini body");
//   console.log(req.params, "ini params");

//   // if (!loc || !rak || !row || !col || !name || !qty) {
//   //   return res.status(400).send("Missing required fields");
//   // }

//   sql.connect(config, function (err) {
//     if (err) {
//       console.log(err);
//       return res.status(500).send("Internal Server Error");
//     }

//     const request = new sql.Request();
//     request.query(
//       `INSERT INTO t_pemetaan_gudang (Lokasi, Rak, Baris, Kolom, Item_Name, Qty, DNc_No, Item_ID, Process_Date ) 
//        VALUES ('${loc}', '${rak}', '${row}', '${col}', '${Item_Name}', ${newQty}, '${formatDNc_No}', '${formatItem_ID}', '${Process_Date}');`,
//       async function (err, result) {
//         if (err) {
//           console.log(err);
//           return res.status(500).send("Failed to add new data");
//         }

//         res.status(201).send("New data added successfully");
//       }
//     );
//   });
// });

// //delete racks
// router.delete("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No", async (req, res) => {
//   const { loc, rak, row, col } = req.params;
//   const formatItem_ID = req.params.Item_ID.replace(/_/g, ' ');
//   const formatDNc_No = req.params.DNc_No.replace(/-/g, '\/')

//   sql.connect(config, function (err) {
//     if (err) {
//       console.log(err);
//       return res.status(500).send("Internal Server Error");
//     }

//     const request = new sql.Request();
//     request.query(
//       `DELETE FROM t_pemetaan_gudang 
//        WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`,
//       async function (err, result) {
//         if (err) {
//           console.log(err);
//           return res.status(500).send("Failed to delete record");
//         }

//         if (result.rowsAffected[0] === 0) {
//           return res.status(404).send("No matching records found");
//         }

//         res.status(200).send("Record deleted successfully");
//       }
//     );
//   });
// });

// //move product to another rack
// router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No/move", async (req, res) => {
//   const { loc, rak, row, col } = req.params;
//   const formatItem_ID = req.params.Item_ID.replace(/_/g, ' ');
//   const formatDNc_No = req.params.DNc_No.replace(/-/g, '\/')
//   const { newQty } = req.body; // Assuming the new quantity is sent in the request body

//   console.log(req.body);
//   sql.connect(config, function (err) {
//     if (err) {
//       console.log(err);
//       return res.status(500).send('Internal Server Error');
//     }
//     const request = new sql.Request();
//     const checkShelf = request.query(
//       `SELECT * FROM t_pemetaan_gudang
//       WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`,
//       async function (err, { recordset }) {
//         if (err) {
//           console.log(err);
//           return res.status(500).send('Internal Server Error');
//         }
//         if (recordset.length === 0) {
//           return res.status(404).send('Bookshelf entry not found');
//         }
//         res.send(recordset);
//       });
//   });
// }); //belom berhasil

// //test
// router.patch("/racks/:loc/:rak/:row/:col/:Item_ID/:DNc_No/moves", async (req, res) => {
//   const { loc, rak, row, col, Item_ID, DNc_No } = req.params;
//   const { new_row, new_col, new_qty } = req.body;

//   sql.connect(config, function (err) {
//     if (err) {
//       console.log(err);
//       return res.status(500).send("Internal Server Error");
//     }

//     const request = new sql.Request();
//     request.query(
//       `DECLARE @OldQty INT;
//        DECLARE @NewQty INT;
//        SET @OldQty = (SELECT Qty FROM t_pemetaan_gudang WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${Item_ID}' AND DNc_No = '${DNc_No}');
//        SET @NewQty = @OldQty - ${new_qty};
//        IF @NewQty < 0
//        BEGIN
//          RETURN 1; -- Quantity cannot be negative
//        END
//        ELSE IF @NewQty = 0
//        BEGIN
//          DELETE FROM t_pemetaan_gudang WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${Item_ID}' AND DNc_No = '${DNc_No}';
//        END
//        ELSE
//        BEGIN
//          UPDATE t_pemetaan_gudang 
//          SET Qty = @NewQty
//          WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${Item_ID}' AND DNc_No = '${DNc_No}';
//        END`,
//       async function (err, result) {
//         if (err) {
//           console.log(err);
//           return res.status(500).send("Failed to update quantity");
//         }

//         if (result.returnValue === 1) {
//           return res.status(400).send("Quantity cannot be negative");
//         }

//         res.status(200).send("Quantity updated successfully");
//       }
//     );
//   });
// });


// //move product to another rack from openai
// // PATCH route to move a certain quantity of books to a new position on the shelf
// // router.patch('/bookshelf/:id/move', async (req, res) => {
// //   const shelfId = req.params.id;
// //   const { new_row_num, new_col_num, quantity } = req.body;

// //   // Validate request body
// //   if (!new_row_num || !new_col_num || !quantity) {
// //       return res.status(400).send('Missing required fields in request body');
// //   }

// //   // Validate quantity
// //   if (quantity <= 0) {
// //       return res.status(400).send('Quantity must be a positive integer');
// //   }

// //   try {
// //       // Check if the bookshelf entry exists
// //       const checkShelf = await pool.query('SELECT * FROM bookshelf WHERE id = $1', [shelfId]);
// //       if (checkShelf.rows.length === 0) {
// //           return res.status(404).send('Bookshelf entry not found');
// //       }

// //       // Get the bookshelf entry details
// //       const shelfEntry = checkShelf.rows[0];

// //       // Check if there's already an entry for the same book_id at the new column and row
// //       const checkNewPosition = await pool.query('SELECT * FROM bookshelf WHERE book_id = $1 AND row_num = $2 AND col_num = $3', [shelfEntry.book_id, new_row_num, new_col_num]);
// //       if (checkNewPosition.rows.length > 0) {
// //           // Update the quantity of the existing entry at the new position
// //           await pool.query('UPDATE bookshelf SET quantity = quantity + $1 WHERE book_id = $2 AND row_num = $3 AND col_num = $4', [quantity, shelfEntry.book_id, new_row_num, new_col_num]);
// //       } else {
// //           // Insert a new entry at the new position with the specified quantity
// //           await pool.query('INSERT INTO bookshelf (book_id, row_num, col_num, quantity) VALUES ($1, $2, $3, $4)', [shelfEntry.book_id, new_row_num, new_col_num, quantity]);
// //       }

// //       // Reduce the original quantity by the moved quantity
// //       await pool.query('UPDATE bookshelf SET quantity = quantity - $1 WHERE id = $2', [quantity, shelfId]);

// //       // Check if the original quantity is zero, if so, delete the entry from the table
// //       const updatedEntry = await pool.query('SELECT * FROM bookshelf WHERE id = $1', [shelfId]);
// //       if (updatedEntry.rows.length > 0 && updatedEntry.rows[0].quantity === 0) {
// //           await pool.query('DELETE FROM bookshelf WHERE id = $1', [shelfId]);
// //       }

// //       res.send('Books moved successfully');
// //   } catch (err) {
// //       console.error('Error executing query', err);
// //       res.status(500).send('Internal Server Error');
// //   }
// // });


// module.exports = router;
