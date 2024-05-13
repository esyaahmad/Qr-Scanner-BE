const sql = require("mssql");
const MyError = require("../helpers/eror");

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

class MsqlController {
  static async fetchProductByScanner(req, res, next) {
    try {
      const data = req.params;
      const ttba = Object.values(data).join("/");

      const pool = await sql.connect(config);
      const request = pool.request();
      const result = await request.query(
        `select   A.TTBA_No,A.TTBA_SeqID,   a.ttba_itemid, case when c.item_type = 'BB' then '' else f.group_name end as group_name \
      , c.item_name, a.ttba_batchno, e.prc_name, d.po_suppname, b.ttba_date, a.ttba_qty, a.ttba_itemUnit \
       , isnull(a.ttba_prcid,'') as ttba_prcid, isnull(a.ttba_suppid,'') as ttba_suppid, isnull(a.ttba_itemrevision,'') as ttba_itemrevision , A.TTBA_SourceDocNo, A.TTBA_DNcNo as [No_analisa]  \
        , convert(varchar(12),A.TTBA_RetestDate,106) as best_before \
        , convert(varchar(12),TTBA_ExpDate,106) as Tgl_daluarsa  from  t_ttba_manufacturing_detail a \
       inner join t_ttba_manufacturing_header b on a.ttba_no = b.ttba_no \
       left join m_item_manufacturing c on a.ttba_itemid = c.item_id \
       left join (select distinct aa.po_no, bb.po_suppname from t_po_manufacturing_detail aa \
       left join t_po_manufacturing_header bb on aa.po_no = bb.po_no) d on a.ttba_sourcedocno = d.po_no \
       left join m_principle e on a.ttba_prcid = e.prc_id \
       left join m_item_group f on c.item_group = f.group_id \
       left join t_TTBA_Manufacturing_Status G on G.TTBA_No = A.TTBA_No \
       left join t_dnc_manufacturing as I on I.DNc_No = a.TTBA_DNcNo \
       where a.ttba_no = '${ttba}' and G.TTBA_No is not null  \
       order by a.ttba_seqid;`
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

  static async fetchRackByItemIDAndDNc_No(req, res, next) {
    try {
      const { loc, rak, row, col } = req.params;
      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");

      //   // console.log(req.params);
      //   // console.log(formatItem_ID, formatDNc_No)
      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `SELECT * FROM t_pemetaan_gudang
                WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}';`
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
        throw new MyError(404, "Rack Not Found");
      const recordset = result?.recordset;
      res.status(200).json(recordset);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async increaseQtyRackByLocItemIDDNcNo(req, res, next) {
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
            SET Qty = Qty + ${newQty}
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

  static async insertProductToRack(req, res, next) {
    try {
      const { loc, rak, row, col } = req.params;
      const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      const { newQty, Process_Date, Item_Name } = req.body; // Assuming the new quantity is sent in the request body

      console.log(req.body, "ini body");
      console.log(req.params, "ini params");

      if (!loc || !rak || !row || !col || !Item_Name || !newQty) {
        return res.status(400).send("Missing required fields");
      }

      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `INSERT INTO t_pemetaan_gudang (Lokasi, Rak, Baris, Kolom, Item_Name, Qty, DNc_No, Item_ID, Process_Date ) 
            VALUES ('${loc}', '${rak}', '${row}', '${col}', '${Item_Name}', ${newQty}, '${formatDNc_No}', '${formatItem_ID}', '${Process_Date}');`
      );
      //   if (result.recordset.length === 0)
      //     throw new MyError(404, "Rack Not Found");
      //   const recordset = result?.recordset;
      res.status(200).json({
        message: "Product added successfully",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

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
}

module.exports = MsqlController;
