const sql = require("mssql");
const MyError = require("../helpers/eror");
const { Op, Sequelize, or } = require("sequelize");
const { t_pemetaan_gudang_detail } = require("../models");
const env = process.env.NODE_ENV || "development";

const config = {
  user: process.env.MS_SQL_DB_USER,
  password: process.env.MS_SQL_DB_PWD,
  server: process.env.MS_SQL_DB_SERVER,
  database: process.env.MS_SQL_DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const configPostgre = require(__dirname + "/../config/config.js")[env];
let sequelize = new Sequelize(
  configPostgre.database,
  configPostgre.username,
  configPostgre.password,
  configPostgre
);

class MsqlController {
  static async fetchProductByScanner(req, res, next) {
    try {
      const { seqId, vat } = req.params;
      // console.log(seqId, vat, "ini seqId dan vat");
      const formatTtba = req.params.ttba.replace(/-/g, "/");
      console.log(req.params, "ini params");

      if (!formatTtba || !seqId || !vat) {
        return res.status(404).send("Rak Not Found");
      }

      // const ttba = Object.values(data).join("/");
      // console.log(data, "ini data");

      const detailFound = await t_pemetaan_gudang_detail.findOne({
        where: {
          ttba_no: formatTtba,
          vat_no: vat,
          seq_id: seqId,
        },
        order: [["createdAt", "DESC"]],
      });
      console.log(detailFound, "detailFound");
      if (detailFound) {
        throw new MyError(
          404,
          `TTBA ${detailFound.ttba_no} sudah terdaftar pada rak ${detailFound.lokasi} sejumlah ${detailFound.qty_per_vat}`
        );
      }

      const pool = await sql.connect(config);
      const request = pool.request();
      const result = await request.query(
        `select   A.TTBA_No,A.TTBA_SeqID,   a.ttba_itemid, case when c.item_type = 'BB' then '' else f.group_name end as group_name \
      , c.item_name, a.ttba_batchno, e.prc_name, d.po_suppname, b.ttba_date, a.ttba_qty, a.ttba_itemUnit \
       , isnull(a.ttba_prcid,'') as ttba_prcid, isnull(a.ttba_suppid,'') as ttba_suppid, isnull(a.ttba_itemrevision,'') as ttba_itemrevision , A.TTBA_SourceDocNo, A.TTBA_DNcNo as [No_analisa]  \
        , convert(varchar(12),A.TTBA_RetestDate,106) as best_before \
        , convert(varchar(12),TTBA_ExpDate,106) as Tgl_daluarsa \
        , A.TTBA_VATQTY \
        , c.Item_Type \ 
        from  t_ttba_manufacturing_detail a \
       inner join t_ttba_manufacturing_header b on a.ttba_no = b.ttba_no \
       left join m_item_manufacturing c on a.ttba_itemid = c.item_id \
       left join (select distinct aa.po_no, bb.po_suppname from t_po_manufacturing_detail aa \
       left join t_po_manufacturing_header bb on aa.po_no = bb.po_no) d on a.ttba_sourcedocno = d.po_no\
       left join m_principle e on a.ttba_prcid = e.prc_id \
       left join m_item_group f on c.item_group = f.group_id \
       left join t_TTBA_Manufacturing_Status G on G.TTBA_No = A.TTBA_No \
       left join t_dnc_manufacturing as I on I.DNc_No = a.TTBA_DNcNo \
       where a.ttba_no = '${formatTtba}' and a.TTBA_SeqID = '${seqId}' and G.TTBA_No is not null  \
       order by a.ttba_seqid;`
      );

      if (result.recordset.length === 0)
        throw new MyError(404, "Product Not Found");
      const recordset = result?.recordset;
      res.status(200).json(recordset);
    } catch (error) {
      console.log(error);
      if (error.name === "SequelizeDatabaseError") {
        return res.status(404).send({ message: "Product Not Found" });
      }
      next(error);
    }
  }

  static async fetchProductByTtbaScanned(req, res, next) {
    try {
      const { DNc_no, item_id, ttba } = req.params;
      const formatTtbaScanned = req.params.ttba.replace(/%2f/g, "/");
      const formatDNc_No = req.params.DNc_no.replace(/%2f/g, "/");
      const formatItem_ID = req.params.item_id.replace(/_/g, " ");
      

      // const formatDNc_TtbaNo = req.params.DNc_no.replace(/-/g, "/");

      // console.log(seqId, vat, "ini seqId dan vat");
      console.log(req.params, "ini params");

      // const ttba = Object.values(data).join("/");
      // console.log(data, "ini data");

      const pool = await sql.connect(config);
      const request = pool.request();
      const result = await request.query(
        `select   A.TTBA_No,A.TTBA_SeqID,   a.ttba_itemid, case when c.item_type = 'BB' then '' else f.group_name end as group_name
        , c.item_name, a.ttba_batchno, e.prc_name, d.po_suppname, b.ttba_date, a.ttba_qty, a.ttba_itemUnit
         , isnull(a.ttba_prcid,'') as ttba_prcid, isnull(a.ttba_suppid,'') as ttba_suppid, isnull(a.ttba_itemrevision,'') as ttba_itemrevision , A.TTBA_SourceDocNo, A.TTBA_DNcNo as [No_analisa]  
          , convert(varchar(12),A.TTBA_RetestDate,106) as best_before 
          , convert(varchar(12),TTBA_ExpDate,106) as Tgl_daluarsa
          , A.TTBA_VATQTY
          , c.Item_Type 
          from  t_ttba_manufacturing_detail a 
         inner join t_ttba_manufacturing_header b on a.ttba_no = b.ttba_no
         left join m_item_manufacturing c on a.ttba_itemid = c.item_id
         left join (select distinct aa.po_no, bb.po_suppname from t_po_manufacturing_detail aa
         left join t_po_manufacturing_header bb on aa.po_no = bb.po_no) d on a.ttba_sourcedocno = d.po_no
         left join m_principle e on a.ttba_prcid = e.prc_id
         left join m_item_group f on c.item_group = f.group_id
         left join t_TTBA_Manufacturing_Status G on G.TTBA_No = A.TTBA_No 
         left join t_dnc_manufacturing as I on I.DNc_No = a.TTBA_DNcNo 
         WHERE a.TTBA_DNcNo  = '${formatDNc_No}' AND a.TTBA_ItemID = '${formatItem_ID}' AND a.TTBA_No = '${formatTtbaScanned}'
         order by a.ttba_seqid`
      );

      if (result.recordset.length === 0)
        throw new MyError(404, "Product Not Found");
      const recordset = result?.recordset;
      res.status(200).json(recordset);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async fetchProductDetailByDncNoAndSeqIdAndVatQty(req, res, next) {
    try {
      const { seqId, vat } = req.params;
      // console.log(seqId, vat, "ini seqId dan vat");
      const formatTtba = req.params.ttba.replace(/-/g, "/");
      console.log(req.params, "ini params detail");

      // const ttba = Object.values(data).join("/");
      // console.log(data, "ini data");

      const detailFound = await t_pemetaan_gudang_detail.findOne({
        where: {
          ttba_no: formatTtba,
          seq_id: String(seqId),
        },
        order: [["createdAt", "DESC"]],
      });
      console.log(detailFound, "detailFound");

      if (!detailFound) throw new MyError(404, "Product Not Found");
      res.status(200).json(detailFound);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  // static async fetchRackByItemIDAndDNc_No(req, res, next) {
  //   try {
  //     const { loc, rak, row, col } = req.params;
  //     const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
  //     const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");

  //     //   // console.log(req.params);
  //     //   // console.log(formatItem_ID, formatDNc_No)
  //     const pool = await sql.connect(config);
  //     const request = pool.request();

  //     const result = await request.query(
  //       `SELECT * FROM t_pemetaan_gudang
  //               WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`
  //     );
  //     if (result.recordset.length === 0)
  //       throw new MyError(404, "Product Not Found");
  //     const recordset = result?.recordset;
  //     res.status(200).json(recordset);
  //   } catch (error) {
  //     console.log(error);
  //     next(error);
  //   }
  // }

  static async fetchRackByTtbaScanned(req, res, next) {
    try {
      const { loc, rak, row, col, ttbaScanned } = req.params;
      const formatTtbaScanned = req.params.ttbaScanned.replace(/%2F/g, "/");
      // const formatDNc_TtbaNo = req.params.DNc_No.replace(/-/g, "/");

        console.log(req.params);
        console.log(formatTtbaScanned, "ini formatTtbaScanned");
      //   // console.log(formatItem_ID, formatDNc_No)
      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `SELECT * FROM t_pemetaan_gudang
        WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND DNc_TTBANo = '${formatTtbaScanned}';`
      );
      if (result.recordset.length === 0)
        throw new MyError(404, "Product Not Found");
      const recordset = result?.recordset;
      res.status(200).json(recordset);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async fetchRackByItemIDAndDNc_NoAndTtba_No(req, res, next) {
    try {
      const { loc, rak, row, col, ttba_no } = req.params;
      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      console.log(req.params, "ini params");

      // function transformString(inputString) {
      //   let result = inputString.replace(/-/g, '\/');
      //   result = result.replace(/%23/g, '#');
      //   return result;
      // }
      // const formatTtba = transformString(ttba_no);

      //   // console.log(req.params);
      //   // console.log(formatItem_ID, formatDNc_No)
      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `SELECT * FROM t_pemetaan_gudang
                WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}' AND DNc_TTBANo = '${ttba_no}';`
      );
      if (result.recordset.length === 0)
        throw new MyError(404, "Product Not Found");
      const recordset = result?.recordset;
      console.log(result, "recordset");
      res.status(200).json(recordset);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async fetchRackByLocation(req, res, next) {
    try {
      const { loc, rak, row, col } = req.params;
      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `SELECT * FROM t_pemetaan_gudang
        WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}';`
      );
      if (result.recordset.length === 0)
        throw new MyError(404, "Rak Kosong!");
      const recordset = result?.recordset;
      res.status(200).json(recordset);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  //kudu tambahin reqbody kayak insert kalo update sama kondisi cek dlu
  static async increaseQtyRackByLocItemIDDNcNo(req, res, next) {
    let t = await sequelize.transaction();
    try {
      const { loc, rak, row, col } = req.params;
      const {
        newQty,
        ttba_no,
        Item_Name,
        seq_id,
        qty_ttba,
        ttba_itemUnit,
        vat_no,
        vat_qty,
        ttba_scanned,
      } = req.body; // Assuming the new quantity is sent in the request body
      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      const formatTtba = ttba_no.replace(/-/g, "/");
      const qty_per_vat = qty_ttba / vat_qty;
      const qty_less = qty_ttba - newQty;
      const location = `${loc}/${rak}/${row}/${col}`;
      console.log(req.body, "ini body increase");

      const detailFound = await t_pemetaan_gudang_detail.findOne({
        where: {
          DNc_TtbaNo: ttba_scanned,
        },
        order: [["createdAt", "DESC"]],
      });
      console.log(detailFound, "detailFound");
      if (detailFound) {
        throw new MyError(
          404,
          `TTBA sudah terdaftar pada rak ini sejumlah ${detailFound.qty_per_vat}`
        );
      }
      // if (detailFound.qty_less <= 0) {
      //   throw new MyError(400, "Quantity is empty, cannot be input!");
      // }

      const detailFoundLatest = await t_pemetaan_gudang_detail.findOne({
        where: {
          ttba_no: formatTtba,
          seq_id: String(seq_id),
        },
        order: [["createdAt", "DESC"]],
      });

      const pool = await sql.connect(config);
      const request = pool.request();
      const result = await request.query(
        // `UPDATE t_pemetaan_gudang
        //     SET Qty = Qty + ${newQty}
        //     WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`

        `UPDATE t_pemetaan_gudang 
            SET Qty = Qty + ${newQty}
            WHERE DNc_TTBANo = '${ttba_scanned}';`
      );
      // console.log(result, "recordset1"); // ada {rowsAffected: [ 1 ]}

      if (detailFoundLatest) {
        await t_pemetaan_gudang_detail.create(
          {
            lokasi: location,
            ttba_no: formatTtba,
            DNc_no: formatDNc_No,
            DNc_TtbaNo: ttba_scanned,
            seq_id,
            item_name: Item_Name,
            item_id: formatItem_ID,
            qty_ttba,
            ttba_itemUnit,
            qty_per_vat: newQty,
            qty_less: detailFoundLatest.qty_less - newQty,
            vat_no,
            vat_qty,
            user_id: "test",
            delegated_to: "test",
            flag: "UPDATED (+)",
          },
          { transaction: t }
        );
        await t.commit();
        res.status(200).json({
          message: "Product added successfully",
        });
      } else {
        await t_pemetaan_gudang_detail.create(
          {
            lokasi: location,
            ttba_no: formatTtba,
            DNc_no: formatDNc_No,
            DNc_TtbaNo: ttba_scanned,
            seq_id,
            item_name: Item_Name,
            item_id: formatItem_ID,
            qty_ttba,
            ttba_itemUnit,
            qty_per_vat: newQty,
            qty_less: qty_ttba - newQty,
            vat_no,
            vat_qty,
            user_id: "test",
            delegated_to: "test",
            flag: "UPDATED (+)",
          },
          { transaction: t }
        );
        await t.commit();
        res.status(200).json({
          message: "Product added successfully",
        });
      }
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  }

  static async decreaseQtyRackByLocItemIDDNcNo(req, res, next) {
    try {
      const { loc, rak, row, col } = req.params;
      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      const { newQty } = req.body; // Assuming the new quantity is sent in the request body
      //   console.log(req.body);
      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `UPDATE t_pemetaan_gudang 
              SET Qty = Qty - ${newQty}
              WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`
      );
      //   if (result.recordset.length === 0)
      //     throw new MyError(404, "Rack Not Found");
      //   const recordset = result?.recordset;
      res.status(200).json({
        message: "Quantity updated successfully",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  //kudu kasih kondisi yang cek dulu ke table postgre ada ga qtynya
  static async insertProductToRack(req, res, next) {
    let t = await sequelize.transaction();
    try {
      const { loc, rak, row, col } = req.params;
      const {
        newQty,
        ttba_no,
        Process_Date,
        Item_Name,
        seq_id,
        qty_ttba,
        ttba_itemUnit,
        vat_no,
        vat_qty,
        ttba_scanned,
      } = req.body; // Assuming the new quantity is sent in the request body

      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      const formatTtba = ttba_no.replace(/-/g, "/");
      const location = `${loc}/${rak}/${row}/${col}`;
      const qty_per_vat = qty_ttba / vat_qty;
      const qty_less = qty_ttba - newQty;

      console.log(req.body, "ini body Insert");
      console.log(req.params, "ini params Insert");

      if (!loc || !rak || !row || !col || !Item_Name || !newQty) {
        return res.status(400).send("Missing required fields");
      }
      const detailFound = await t_pemetaan_gudang_detail.findOne({
        where: {
          DNc_TtbaNo: ttba_scanned,
        },
        order: [["createdAt", "DESC"]],
      });
      console.log(detailFound, "detailFound");
      if (detailFound) {
        throw new MyError(
          404,
          `TTBA sudah terdaftar pada rak ${detailFound.lokasi} sejumlah ${detailFound.qty_per_vat}`
        );
      }

      const detailFoundLatest = await t_pemetaan_gudang_detail.findOne({
        where: {
          ttba_no: formatTtba,
          seq_id: String(seq_id),
        },
        order: [["createdAt", "DESC"]],
      });
      console.log(detailFoundLatest, "detailFoundLatest");

      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `INSERT INTO t_pemetaan_gudang (Lokasi, Rak, Baris, Kolom, Item_Name, Qty, DNc_No, Item_ID, Process_Date, DNc_TTBANo) 
            VALUES ('${loc}', '${rak}', '${row}', '${col}', '${Item_Name}', ${newQty}, '${formatDNc_No}', '${formatItem_ID}', '${Process_Date}', '${ttba_scanned}');`
      );
      //   if (result.recordset.length === 0)
      //     throw new MyError(404, "Rack Not Found");
      //   const recordset = result?.recordset;

      if (detailFoundLatest) {
        await t_pemetaan_gudang_detail.create(
          {
            lokasi: location,
            ttba_no: formatTtba,
            DNc_no: formatDNc_No,
            DNc_TtbaNo: ttba_scanned,
            seq_id,
            item_name: Item_Name,
            item_id: formatItem_ID,
            qty_ttba,
            ttba_itemUnit,
            qty_per_vat: newQty,
            qty_less: detailFoundLatest.qty_less - newQty,
            vat_no,
            vat_qty,
            user_id: "test",
            delegated_to: "test",
            flag: "CREATED",
          },
          { transaction: t }
        );
        await t.commit();
        res.status(200).json({
          message: "Product added successfully",
        });
      } else {
        await t_pemetaan_gudang_detail.create(
          {
            lokasi: location,
            ttba_no: formatTtba,
            DNc_no: formatDNc_No,
            DNc_TtbaNo: ttba_scanned,
            seq_id,
            item_name: Item_Name,
            item_id: formatItem_ID,
            qty_ttba,
            ttba_itemUnit,
            qty_per_vat: newQty,
            qty_less: qty_ttba - newQty,
            vat_no,
            vat_qty,
            user_id: "test",
            delegated_to: "test",
            flag: "CREATED",
          },
          { transaction: t }
        );
        await t.commit();
        res.status(200).json({
          message: "Product added successfully",
        });
      }

      // await t.commit();
      // res.status(200).json({
      //   message: "Product added successfully",
      // });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  }

  static async insertMoveProductToRack(req, res, next) {
    let t = await sequelize.transaction();
    try {
      const { loc, rak, row, col } = req.params;
      const {
        newQty,
        ttba_no,
        Process_Date,
        Item_Name,
        seq_id,
        qty_ttba,
        ttba_itemUnit,
        vat_no,
        vat_qty,
        ttba_scanned,
      } = req.body; // Assuming the new quantity is sent in the request body

      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      const formatTtba = ttba_no.replace(/-/g, "/");
      const location = `${loc}/${rak}/${row}/${col}`;
      const qty_per_vat = qty_ttba / vat_qty;
      const qty_less = qty_ttba - newQty;

      console.log(req.body, "ini body");
      console.log(req.params, "ini params");

      if (!loc || !rak || !row || !col || !Item_Name || !newQty) {
        return res.status(400).send("Missing required fields");
      }
      // const detailFound = await t_pemetaan_gudang_detail.findOne({
      //   where: {
      //     ttba_no: formatTtba,
      //     DNc_no: formatDNc_No,
      //     item_id: formatItem_ID,
      //     seq_id,
      //     vat_no,
      //     vat_qty,
      //   },
      //   order: [["createdAt", "DESC"]],
      // });
      // console.log(detailFound, "detailFound");
      // if (detailFound) {
      //   throw new MyError(404, `TTBA sudah terdaftar pada rak ${detailFound.lokasi} sejumlah ${detailFound.qty_per_vat}`);
      // }

      const detailFoundLatest = await t_pemetaan_gudang_detail.findOne({
        where: {
          ttba_no: formatTtba,
          seq_id: String(seq_id),
        },
        order: [["createdAt", "DESC"]],
      });
      console.log(detailFoundLatest, "detailFoundLatest");

      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `INSERT INTO t_pemetaan_gudang (Lokasi, Rak, Baris, Kolom, Item_Name, Qty, DNc_No, Item_ID, Process_Date, DNc_TTBANo) 
            VALUES ('${loc}', '${rak}', '${row}', '${col}', '${Item_Name}', ${newQty}, '${formatDNc_No}', '${formatItem_ID}', '${Process_Date}', '${ttba_scanned}');`
      );
      if (result.length === 0)
        throw new MyError(404, "Rack Not Found");
      const recordset = result?.recordset;

      await t_pemetaan_gudang_detail.create(
        {
          lokasi: location,
          ttba_no: formatTtba,
          DNc_no: formatDNc_No,
          DNc_TtbaNo: ttba_scanned,
          seq_id,
          item_name: Item_Name,
          item_id: formatItem_ID,
          qty_ttba,
          ttba_itemUnit,
          qty_per_vat: newQty,
          qty_less: detailFoundLatest.qty_less,
          vat_no,
          vat_qty,
          user_id: "test",
          delegated_to: "test",
          flag: "CREATED (m)",
        },
        { transaction: t }
      );
      await t.commit();
      res.status(200).json({
        message: "Product added successfully",
      });
      // if (detailFoundLatest) {
      //   await t_pemetaan_gudang_detail.create(
      //     {
      //       lokasi: location,
      //       ttba_no: formatTtba,
      //       DNc_no: formatDNc_No,
      //       seq_id,
      //       item_name: Item_Name,
      //       item_id: formatItem_ID,
      //       qty_ttba,
      //       ttba_itemUnit,
      //       qty_per_vat : newQty,
      //       qty_less: detailFoundLatest.qty_less,
      //       vat_no,
      //       vat_qty,
      //       user_id: "test",
      //       delegated_to: "test",
      //       flag: "CREATED",
      //     },
      //     { transaction: t }

      //   );
      //   await t.commit();
      // res.status(200).json({
      //   message: "Product added successfully",
      // });
      // } else {
      //   await t_pemetaan_gudang_detail.create(
      //     {
      //       lokasi: location,
      //       ttba_no: formatTtba,
      //       DNc_no: formatDNc_No,
      //       seq_id,
      //       item_name: Item_Name,
      //       item_id: formatItem_ID,
      //       qty_ttba,
      //       ttba_itemUnit,
      //       qty_per_vat : newQty,
      //       qty_less: qty_ttba - newQty,
      //       vat_no,
      //       vat_qty,
      //       user_id: "test",
      //       delegated_to: "test",
      //       flag: "CREATED",
      //     },
      //     { transaction: t }
      //   );
      //   await t.commit();
      // res.status(200).json({
      //   message: "Product added successfully",
      // });
      // }

      // await t.commit();
      // res.status(200).json({
      //   message: "Product added successfully",
      // });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  }

  //buat delete di postman
  static async deleteProductFromRack(req, res, next) {
    try {
      const { loc, rak, row, col } = req.params;
      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      const pool = await sql.connect(config);
      const request = pool.request();
      // console.log(req.params);

      const result = await request.query(
        `DELETE FROM t_pemetaan_gudang 
        WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`
      );
      // Check if any rows were affected
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async deleteProductFromRackByTtbaScanned(req, res, next) {
    let t = await sequelize.transaction();
    try {
      const { loc, rak, row, col, ttbaScanned } = req.params;
      const {
        newQty,
        ttba_no,
        Process_Date,
        Item_Name,
        seq_id,
        qty_ttba,
        ttba_itemUnit,
        vat_no,
        vat_qty,
        ttba_scanned,
      } = req.body;
      const location = `${loc}/${rak}/${row}/${col}`;
      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      // cons= ttba_no.replace(/-/g, "/");
      const pool = await sql.connect(config);
      const request = pool.request();
      // console.log(req.params);

      const result = await request.query(
        `DELETE FROM t_pemetaan_gudang 
        WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}' AND DNc_TTBANo = '${ttbaScanned}';`
      );
      // Check if any rows were affected
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      await t_pemetaan_gudang_detail.create(
        {
          lokasi: location,
          ttba_no,
          DNc_no: formatDNc_No,
          DNc_TtbaNo: ttba_scanned,
          seq_id,
          item_name: Item_Name,
          item_id: formatItem_ID,
          qty_ttba,
          ttba_itemUnit,
          qty_per_vat: newQty,
          qty_less: newQty,
          vat_no,
          vat_qty,
          user_id: "test",
          delegated_to: "test",
          flag: "DELETED (m)",
        },
        { transaction: t }
      );
      await t.commit();
      res.status(200).json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}



module.exports = MsqlController;
