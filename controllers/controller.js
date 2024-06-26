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
  requestTimeout: 30000 // 30 seconds
};

const configPostgre = require(__dirname + "/../config/config.js")[env];
let sequelize = new Sequelize(
  configPostgre.database,
  configPostgre.username,
  configPostgre.password,
  configPostgre
);

class MsqlController {
  //for fetch data from mssql on insert product
  static async fetchProductByScanner(req, res, next) {
    try {
      const { seqId, vat } = req.params;
      // console.log(seqId, vat, "ini seqId dan vat");
      const formatTtba = req.params.ttba.replace(/-/g, "/");
      // console.log(req.params, "ini params");

      if (!formatTtba || !seqId || !vat) {
        return res.status(404).send("Rak Not Found");
      }

      // const ttba = Object.values(data).join("/");
      // console.log(data, "ini data");

      // const detailFound = await t_pemetaan_gudang_detail.findOne({
      //   where: {
      //     ttba_no: formatTtba,
      //     vat_no: vat,
      //     seq_id: seqId,
      //   },
      //   order: [["createdAt", "DESC"]],
      // });
      // console.log(detailFound, "detailFound");
      // if (detailFound) {
      //   throw new MyError(
      //     404,
      //     `TTBA ${detailFound.ttba_no} sudah terdaftar pada rak ${detailFound.lokasi} sejumlah ${detailFound.qty_per_vat}${detailFound.ttba_itemUnit}`
      //   );
      // }

      const pool = await sql.connect(config);
      const request = pool.request();

      const dataFound = await request.query(
        `SELECT * FROM t_pemetaan_gudang
        WHERE DNc_TTBANo = '${formatTtba}#${seqId}#${vat}';`
      );
      // console.log(dataFound, "dataFound");
      if (dataFound.recordset.length > 0) {
        throw new MyError(
          404,
          `TTBA ${formatTtba}#${seqId}#${vat} sudah terdaftar pada rak ${dataFound.recordset[0].Lokasi}/${dataFound.recordset[0].Rak}/${dataFound.recordset[0].Baris}/${dataFound.recordset[0].Kolom} sejumlah ${dataFound.recordset[0].Qty}`
        );
      }

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
      // console.log(result, "result");

      if (result.recordset.length === 0)
        throw new MyError(404, "TTBA tidak ditemukan");
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

  //for fetch data from mssql on insert bulk product
  static async fetchProductByScannerPerTtba(req, res, next) {
    try {
      const { seqId, vat } = req.params;
      // console.log(seqId, vat, "ini seqId dan vat");
      const formatTtba = req.params.ttba.replace(/-/g, "/");
      // console.log(req.params, "ini params");

      if (!formatTtba || !seqId || !vat) {
        return res.status(404).send("Rak Not Found");
      }

      // const ttba = Object.values(data).join("/");
      // console.log(data, "ini data");

      // const detailFound = await t_pemetaan_gudang_detail.findOne({
      //   where: {
      //     ttba_no: formatTtba,
      //     vat_no: vat,
      //     seq_id: seqId,
      //   },
      //   order: [["createdAt", "DESC"]],
      // });
      // console.log(detailFound, "detailFound");
      // if (detailFound) {
      //   throw new MyError(
      //     404,
      //     `TTBA ${detailFound.ttba_no} sudah terdaftar pada rak ${detailFound.lokasi} sejumlah ${detailFound.qty_per_vat}${detailFound.ttba_itemUnit}`
      //   );
      // }

      const pool = await sql.connect(config);
      const request = pool.request();

      const dataFound = await request.query(
        `SELECT * FROM t_pemetaan_gudang
        WHERE DNc_TTBANo = '${formatTtba}#${seqId}#${vat}';`
      );
      console.log(dataFound, "dataFound");
      if (dataFound.recordset.length > 0) {
        throw new MyError(
          404,
          `TTBA ${formatTtba}#${seqId}#${vat} sudah terdaftar pada rak ${dataFound.recordset[0].Lokasi}/${dataFound.recordset[0].Rak}/${dataFound.recordset[0].Baris}/${dataFound.recordset[0].Kolom} sejumlah ${dataFound.recordset[0].Qty}`
        );
      }

      const result = await request.query(
        `select   A.TTBA_No,A.TTBA_SeqID,   a.ttba_itemid, case when c.item_type = 'BB' then '' else f.group_name end as group_name
        , c.item_name, a.ttba_batchno, e.prc_name, d.po_suppname, b.ttba_date, a.ttba_qty, a.ttba_itemUnit
         , isnull(a.ttba_prcid,'') as ttba_prcid, isnull(a.ttba_suppid,'') as ttba_suppid, isnull(a.ttba_itemrevision,'') as ttba_itemrevision , A.TTBA_SourceDocNo, A.TTBA_DNcNo as [No_analisa]  
          , convert(varchar(12),A.TTBA_RetestDate,106) as best_before 
          , convert(varchar(12),TTBA_ExpDate,106) as Tgl_daluarsa
          , A.TTBA_VATQTY
          , c.Item_Type
          , H.ttba_vatno, H.TTBA_vatqty as TTBA_qty_per_Vat
          from  t_ttba_manufacturing_detail a 
         inner join t_ttba_manufacturing_header b on a.ttba_no = b.ttba_no
         left join m_item_manufacturing c on a.ttba_itemid = c.item_id
         left join (select distinct aa.po_no, bb.po_suppname from t_po_manufacturing_detail aa
         left join t_po_manufacturing_header bb on aa.po_no = bb.po_no) d on a.ttba_sourcedocno = d.po_no
         left join m_principle e on a.ttba_prcid = e.prc_id
         left join m_item_group f on c.item_group = f.group_id
         left join t_TTBA_Manufacturing_Status G on G.TTBA_No = A.TTBA_No 
         left join t_dnc_manufacturing as I on I.DNc_No = a.TTBA_DNcNo 
         left join t_ttba_manufacturing_detail_vat as H on H.TTBA_no = a.ttba_no and H.ttba_seqid = a.ttba_seqid
         where a.ttba_no = '${formatTtba}' and G.TTBA_No is not null
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

  //for fetch data pervat from mssql on withdraw product
  static async fetchProductByScannerPerVat(req, res, next) {
    try {
      const { seqId, vat } = req.params;
      // console.log(seqId, vat, "ini seqId dan vat");
      const formatTtba = req.params.ttba.replace(/-/g, "/");
      // console.log(req.params, "ini params");

      if (!formatTtba || !seqId || !vat) {
        return res.status(404).send("missing params");
      }

      const pool = await sql.connect(config);
      const request = pool.request();

      // const dataFound = await request.query(
      //   `SELECT * FROM t_pemetaan_gudang
      //   WHERE DNc_TTBANo = '${formatTtba}#${seqId}#${vat}';`
      // );
      // console.log(dataFound, "dataFound");
      // if (dataFound.recordset.length > 0) {
      //   throw new MyError(
      //     404,
      //     `TTBA ${formatTtba}#${seqId}#${vat} sudah terdaftar pada rak ${dataFound.recordset[0].Lokasi}/${dataFound.recordset[0].Rak}/${dataFound.recordset[0].Baris}/${dataFound.recordset[0].Kolom} sejumlah ${dataFound.recordset[0].Qty}`
      //   );
      // }

      const result = await request.query(
        `select   A.TTBA_No,A.TTBA_SeqID,   a.ttba_itemid, case when c.item_type = 'BB' then '' else f.group_name end as group_name
        , c.item_name, a.ttba_batchno, e.prc_name, d.po_suppname, b.ttba_date, a.ttba_qty, a.ttba_itemUnit
         , isnull(a.ttba_prcid,'') as ttba_prcid, isnull(a.ttba_suppid,'') as ttba_suppid, isnull(a.ttba_itemrevision,'') as ttba_itemrevision , A.TTBA_SourceDocNo, A.TTBA_DNcNo as [No_analisa]  
          , convert(varchar(12),A.TTBA_RetestDate,106) as best_before 
          , convert(varchar(12),TTBA_ExpDate,106) as Tgl_daluarsa
          , A.TTBA_VATQTY
          , c.Item_Type
          , H.ttba_vatno, H.TTBA_vatqty as TTBA_qty_per_Vat
          from  t_ttba_manufacturing_detail a 
         inner join t_ttba_manufacturing_header b on a.ttba_no = b.ttba_no
         left join m_item_manufacturing c on a.ttba_itemid = c.item_id
         left join (select distinct aa.po_no, bb.po_suppname from t_po_manufacturing_detail aa
         left join t_po_manufacturing_header bb on aa.po_no = bb.po_no) d on a.ttba_sourcedocno = d.po_no
         left join m_principle e on a.ttba_prcid = e.prc_id
         left join m_item_group f on c.item_group = f.group_id
         left join t_TTBA_Manufacturing_Status G on G.TTBA_No = A.TTBA_No 
         left join t_dnc_manufacturing as I on I.DNc_No = a.TTBA_DNcNo 
         left join t_ttba_manufacturing_detail_vat as H on H.TTBA_no = a.ttba_no and H.ttba_seqid = a.ttba_seqid
         where a.ttba_no = '${formatTtba}' and a.TTBA_SeqID = '${seqId}' and H.ttba_vatno = '${vat}' and G.TTBA_No is not null
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

  //for fetch data pervat from mssql and fetch data from table kecil on insert timbang product
  static async fetchProductByScannerPerVatAndStockPosition(req, res, next) {
    try {
      const { seqId, vat } = req.params;
      // console.log(seqId, vat, "ini seqId dan vat");
      const formatTtba = req.params.ttba.replace(/-/g, "/");
      // console.log(req.params, "ini params");

      if (!formatTtba || !seqId || !vat) {
        return res.status(404).send("missing params");
      }

      const pool = await sql.connect(config);
      const request = pool.request();

      const cekTtba = await request.query(
        `select   A.TTBA_No,A.TTBA_SeqID,   a.ttba_itemid, case when c.item_type = 'BB' then '' else f.group_name end as group_name
        , c.item_name, a.ttba_batchno, e.prc_name, d.po_suppname, b.ttba_date, a.ttba_qty, a.ttba_itemUnit
         , isnull(a.ttba_prcid,'') as ttba_prcid, isnull(a.ttba_suppid,'') as ttba_suppid, isnull(a.ttba_itemrevision,'') as ttba_itemrevision , A.TTBA_SourceDocNo, A.TTBA_DNcNo as [No_analisa]  
          , convert(varchar(12),A.TTBA_RetestDate,106) as best_before 
          , convert(varchar(12),TTBA_ExpDate,106) as Tgl_daluarsa
          , A.TTBA_VATQTY
          , c.Item_Type
          , H.ttba_vatno, H.TTBA_vatqty as TTBA_qty_per_Vat
          from  t_ttba_manufacturing_detail a 
         inner join t_ttba_manufacturing_header b on a.ttba_no = b.ttba_no
         left join m_item_manufacturing c on a.ttba_itemid = c.item_id
         left join (select distinct aa.po_no, bb.po_suppname from t_po_manufacturing_detail aa
         left join t_po_manufacturing_header bb on aa.po_no = bb.po_no) d on a.ttba_sourcedocno = d.po_no
         left join m_principle e on a.ttba_prcid = e.prc_id
         left join m_item_group f on c.item_group = f.group_id
         left join t_TTBA_Manufacturing_Status G on G.TTBA_No = A.TTBA_No 
         left join t_dnc_manufacturing as I on I.DNc_No = a.TTBA_DNcNo 
         left join t_ttba_manufacturing_detail_vat as H on H.TTBA_no = a.ttba_no and H.ttba_seqid = a.ttba_seqid
         where a.ttba_no = '${formatTtba}' and a.TTBA_SeqID = '${seqId}' and H.ttba_vatno = '${vat}' and G.TTBA_No is not null
         order by a.ttba_seqid;`
      );

      if (cekTtba.recordset.length === 0)
        throw new MyError(404, "Product Not Found");

      const cekStockPosition = await request.query(
        `SELECT * FROM t_item_stock_position_dnc_kecil
        WHERE Dnc_no = '${cekTtba?.recordset[0]?.No_analisa}' AND Item_ID = '${cekTtba?.recordset[0]?.ttba_itemid}' AND Vat_no = '${vat}';`
      );
      // console.log(cekStockPosition, "cekStockPosition");
      // console.log(cekTtba, "cekTtba");
      if (cekStockPosition.recordset.length === 0)
        throw new MyError(404, "Stock Position Not Found");

      const dataFound = await request.query(
        `SELECT * FROM t_pemetaan_gudang
        WHERE DNc_TTBANo = '${formatTtba}#${seqId}#${vat}';`
      );
      if (dataFound.recordset.length > 0) {
        throw new MyError(
          404,
          `TTBA ${formatTtba}#${seqId}#${vat} sudah terdaftar pada rak ${dataFound.recordset[0].Lokasi}/${dataFound.recordset[0].Rak}/${dataFound.recordset[0].Baris}/${dataFound.recordset[0].Kolom} sejumlah ${dataFound.recordset[0].Qty}`
        );
      }
      console.log(dataFound, "dataFound");

      const recordsetTtba = cekTtba?.recordset[0];
      const recordsetStockPosition = cekStockPosition?.recordset[0];

      res.status(200).json({ recordsetTtba, recordsetStockPosition });
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
          flag: "INSERTED" || "UPDATED",
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

  // //cara 3 berhasil bener tapi lelet
  // static async fetchAllStockGudang(req, res, next) {
  //   const { page = 1, limit = 100 } = req.query;
  //   try {
  //     const pool = await sql.connect(config);
  //     const request = pool.request();
  //     request.input("PageNumber", sql.Int, parseInt(page));
  //     request.input("PageSize", sql.Int, parseInt(limit));

  //     // cara 1 berhasil cepet tapi tanpa join
  //     // const result = await request.query(`
  //     //   SELECT * FROM (
  //     //   SELECT ROW_NUMBER() OVER (ORDER BY Item_ID) AS RowNum, *
  //     //   FROM t_pemetaan_gudang WHERE Qty > 0
  //     //   ) AS RowConstrainedResult
  //     //    WHERE RowNum >= (@PageNumber - 1) * @PageSize + 1
  //     //    AND RowNum < @PageNumber * @PageSize + 1;
  //     //   `);
  //     // const totalCount = await request.query(`
  //     //     SELECT COUNT(*) as count FROM t_pemetaan_gudang;
  //     //   `);

  //     // const recordset = result?.recordset;
  //     // res.status(200).json({
  //     //   data: recordset,
  //     //   total: totalCount.recordset[0].count,
  //     //   page: parseInt(page),
  //     //   limit: parseInt(limit),
  //     // });
  //     // // console.log(totalCount.recordset[0].count, 'ini total count');
  //     // // console.log(offset, limit, 'ini page dan limit');


  //     // CARA 3 
  //     const result = await request.query(`
  //       SELECT * FROM (
  //           SELECT ROW_NUMBER() OVER (ORDER BY tpg.DNc_No) AS RowNum, tpg.*, mim.Item_Unit, mim.Item_Type, tispd.st_ED
  //           FROM t_Pemetaan_Gudang tpg 
  //           LEFT JOIN m_Item_Manufacturing mim ON tpg.Item_ID = mim.Item_ID 
  //           LEFT JOIN (
  //               SELECT St_ItemID, st_ED, St_DNcNo
  //               FROM t_Item_Stock_Position_DNc 
  //               WHERE St_Periode = '2024 05'
  //           ) tispd ON tpg.DNc_No = tispd.St_DNcNo AND tpg.Item_ID = tispd.St_ItemID
  //           WHERE tpg.Qty > 0
  //       ) AS RowConstrainedResult
  //       WHERE RowNum >= (@PageNumber - 1) * @PageSize + 1
  //       AND RowNum < @PageNumber * @PageSize + 1;
  //   `);
    
  //   const totalCount = await request.query(`
  //       SELECT COUNT(*) as count
  //       FROM t_Pemetaan_Gudang tpg 
  //       LEFT JOIN m_Item_Manufacturing mim ON tpg.Item_ID = mim.Item_ID 
  //       LEFT JOIN (
  //           SELECT St_ItemID, st_ED, St_DNcNo
  //           FROM t_Item_Stock_Position_DNc 
  //           WHERE St_Periode = '2024 05'
  //       ) tispd ON tpg.DNc_No = tispd.St_DNcNo AND tpg.Item_ID = tispd.St_ItemID
  //       WHERE tpg.Qty > 0;
  //   `);
    
  //   console.log(totalCount, 'ini total count')
    
  //   const recordset = result?.recordset;
  //   res.status(200).json({
  //       data: recordset,
  //       total: totalCount.recordset[0].count,
  //       page: parseInt(page),
  //       limit: parseInt(limit),
  //   });
    
  //     //cara dua berhasil dg join tapi lelet
  //   //   const result = await request.query(`
  //   //     SELECT * FROM (
  //   //         SELECT
  //   //             ROW_NUMBER() OVER (ORDER BY tpg.Item_ID) AS RowNum,
  //   //             tpg.Lokasi,
  //   //             tpg.Rak,
  //   //             tpg.Baris,
  //   //             tpg.Kolom,
  //   //             tpg.DNc_No,
  //   //             tpg.DNc_TTBANo,
  //   //             tpg.Item_ID,
  //   //             tpg.Item_Name,
  //   //             tpg.Qty,
  //   //             tpg.Process_Date,
  //   //             tpg.User_ID,
  //   //             tpg.Delegated_To,
  //   //             tpg.flag_update,
  //   //             ttmd.TTBA_ItemUnit,
  //   //             tispd.st_ED
  //   //         FROM
  //   //             t_Pemetaan_Gudang tpg
  //   //         LEFT JOIN
  //   //             t_TTBA_Manufacturing_Detail ttmd
  //   //             ON tpg.Item_ID = ttmd.TTBA_ItemID
  //   //         LEFT JOIN
  //   //             t_Item_Stock_Position_DNc tispd
  //   //             ON tpg.Item_ID = tispd.St_ItemID
  //   //         WHERE
  //   //             tpg.Qty > 0
  //   //             AND ttmd.TTBA_No LIKE '%BB%'
  //   //             AND tispd.st_ED is not null
  //   //     ) AS RowConstrainedResult
  //   //     WHERE
  //   //         RowNum >= (@PageNumber - 1) * @PageSize + 1
  //   //         AND RowNum < @PageNumber * @PageSize + 1;
  //   // `);

  //   // const totalCount = await request.query(`
  //   //     SELECT COUNT(*) as count
  //   //     FROM
  //   //         t_Pemetaan_Gudang tpg
  //   //     LEFT JOIN
  //   //         t_TTBA_Manufacturing_Detail ttmd
  //   //         ON tpg.Item_ID = ttmd.TTBA_ItemID
  //   //     LEFT JOIN
  //   //         t_Item_Stock_Position_DNc tispd
  //   //         ON tpg.Item_ID = tispd.St_ItemID
  //   //     WHERE
  //   //         tpg.Qty > 0
  //   //         AND ttmd.TTBA_No LIKE '%BB%'
  //   //         AND tispd.st_ED is not null;
  //   // `);

  //   // const recordset = result?.recordset;
  //   // res.status(200).json({
  //   //     data: recordset,
  //   //     total: totalCount.recordset[0].count,
  //   //     page: parseInt(page),
  //   //     limit: parseInt(limit),
  //   // });

  //   } catch (error) {
  //     console.log(error);
  //     next(error);
  //   }
  // }

  static async fetchAllStockGudang(req, res, next) {
    const { page = 1, limit = 50 } = req.query;
  
    try {
      const pool = await sql.connect(config);
      const request = pool.request();
  
      const offset = (parseInt(page) - 1) * parseInt(limit);
  
      // Fetch the paginated data
      const result = await request
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
         SELECT paged.*, mim.Item_Unit, mim.Item_Type, tispd.st_ED
        FROM (
            SELECT tpg.*, ROW_NUMBER() OVER (ORDER BY tpg.DNc_No) AS RowNum
            FROM t_Pemetaan_Gudang tpg 
            WHERE tpg.Qty > 0
        ) AS paged
        LEFT JOIN m_Item_Manufacturing mim ON paged.Item_ID = mim.Item_ID 
        LEFT JOIN (
            SELECT St_ItemID, st_ED, St_DNcNo
            FROM t_Item_Stock_Position_DNc 
            WHERE St_Periode = '2024 05'
        ) tispd ON paged.DNc_No = tispd.St_DNcNo AND paged.Item_ID = tispd.St_ItemID
        WHERE paged.RowNum > @offset AND paged.RowNum <= @offset + @limit
        ORDER BY paged.DNc_No
        `);
  
      // Fetch the total count
      const totalCount = await request.query(`
        SELECT COUNT(*) as count
        FROM t_Pemetaan_Gudang tpg 
        WHERE tpg.Qty > 0
      `);
  
      const recordset = result?.recordset;
      res.status(200).json({
        data: recordset,
        total: totalCount.recordset[0].count,
        page: parseInt(page),
        limit: parseInt(limit),
      });
  
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  
  
  

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

  //untuk fetch rack di withdraw product by ttba scanned
  static async fetchRackProductByTtbaScanned(req, res, next) {
    try {
      const { ttbaScanned } = req.params;
      console.log(req.params, "ini params fetchRackProductByTtbaScanned");
      const formatTtbaScanned = req.params.ttbaScanned
        .replace(/%2F/g, "/")
        .replace(/%23/g, "#");
      const pool = await sql.connect(config);
      const request = pool.request();
      const result = await request.query(
        `SELECT * FROM t_pemetaan_gudang
        WHERE DNc_TTBANo = '${formatTtbaScanned}';`
      );
      if (result.recordset.length === 0)
        throw new MyError(404, "Product Not Found In Rack");
      const recordset = result?.recordset;
      res.status(200).json(recordset);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async fetchRackByProductTtba(req, res, next) {
    try {
      // const { loc, rak, row, col, DNc_No } = req.params;
      const formatDNc_No = req.params.DNc_No.replace(/-/g, "/");
      // const formatDNc_TtbaNo = req.params.DNc_No.replace(/-/g, "/");

      console.log(req.params, "ini params");
      console.log(formatDNc_No, "ini formatDNc_No");
      //   // console.log(formatItem_ID, formatDNc_No)
      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `SELECT * FROM t_pemetaan_gudang
        WHERE DNc_No = '${formatDNc_No}';`
      );
      // if (result.recordset.length === 0)
      //   throw new MyError(404, "Product Not Found");
      // const recordset = result?.recordset;
      res.status(200).json(result?.recordset);
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
        throw new MyError(404, "Rak Not Found");
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
        throw new MyError(404, "Rak Tidak ditemukan / Kosong");
      const recordset = result?.recordset;
      res.status(200).json(recordset);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  //fetch product di bulk insert
  static async fetchRackByArrTtba(req, res, next) {
    try {
      const { loc, rak, row, col } = req.params; // Assuming these are still passed as params
      const { ttbaScanned } = req.body; // Array of ttbaScanned values
      console.log(req.body, "ini body fetchRackByArrTtba");
      console.log(req.params, "ini params fetchRackByArrTtba");

      if (!Array.isArray(ttbaScanned) || ttbaScanned.length === 0) {
        throw new MyError(400, "Invalid or empty ttbaScanned array");
      }

      const ttbaScannedList = ttbaScanned.map((ttba) => `'${ttba}'`).join(", ");
      console.log(ttbaScannedList, "ini ttbaScannedList");
      const pool = await sql.connect(config);
      const request = pool.request();

      const query = `
        SELECT * FROM t_pemetaan_gudang
        WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}'
        AND DNc_TTBANo IN (${ttbaScannedList});
      `;

      const result = await request.query(query);
      console.log(result, "recordset");
      if (result.recordset.length === 0) {
        throw new MyError(404, "Product Not Found");
      }
      res.status(200).json(result.recordset);
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
    let t = await sequelize.transaction();
    try {
      const { loc, rak, row, col } = req.params;
      const formatTtbaScanned = req.params.ttbaScanned
        .replace(/%2F/g, "/")
        .replace(/%23/g, "#");
      const { newQty } = req.body; // Assuming the new quantity is sent in the request body
      //   console.log(req.body);
      const ttba = formatTtbaScanned.split("#")[0];
      const seq_id = formatTtbaScanned.split("#")[1];
      const vat_no = formatTtbaScanned.split("#")[2];
      const pool = await sql.connect(config);
      const request = pool.request();

      const found = await request.query(
        `SELECT * FROM t_pemetaan_gudang
              WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND DNc_TTBANo = '${formatTtbaScanned}';`
      );
      console.log(found, "found");

      if (found.recordset.length === 0)
        throw new MyError(404, "Product Not Found");

      const product = found.recordset[0];

      const result = await request.query(
        `UPDATE t_pemetaan_gudang 
              SET Qty = Qty - ${newQty}
              WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND DNc_TTBANo = '${formatTtbaScanned}' ;`
      );

      if (result.rowsAffected[0] === 0)
        throw new MyError(404, "Product Not Found");

      await t_pemetaan_gudang_detail.create(
        {
          lokasi: `${loc}/${rak}/${row}/${col}`,
          ttba_no: ttba,
          DNc_no: product.DNc_No,
          DNc_TtbaNo: formatTtbaScanned,
          seq_id,
          item_name: product.Item_Name,
          item_id: product.Item_ID,
          qty_ttba: product.Qty,
          ttba_itemUnit: product.Item_Unit, //harus fetch ttba dulu
          qty_per_vat: newQty,
          qty_less: 0, //harus diralat ke qtyless terakhir
          vat_no,
          vat_qty: newQty,
          user_id: "test",
          delegated_to: "test",
          flag: "SAMPLING (-)",
        },
        { transaction: t }
      );
      await t.commit();

      res.status(200).json({
        message: "Quantity updated successfully",
      });
    } catch (error) {
      await t.rollback();
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
      // const detailFound = await t_pemetaan_gudang_detail.findOne({
      //   where: {
      //     DNc_TtbaNo: ttba_scanned,
      //   },
      //   order: [["createdAt", "DESC"]],
      // });
      // console.log(detailFound, "detailFound");

      const detailFoundLatest = await t_pemetaan_gudang_detail.findOne({
        where: {
          ttba_no: formatTtba,
          seq_id: String(seq_id),
          flag: "INSERTED" || "UPDATED",
        },
        order: [["createdAt", "DESC"]],
      });
      // console.log(detailFoundLatest, "detailFoundLatest");

      const pool = await sql.connect(config);
      const request = pool.request();

      const detailFound = await request.query(`
      SELECT * FROM t_pemetaan_gudang
      WHERE DNc_TTBANo = '${ttba_scanned}' AND Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}';
      `); // HARUS DIGANTI WHERE DNc_TTBANo = '${ttba_scanned}' SAJA
      console.log(detailFound, "detailFound");
      if (detailFound.recordset.length > 0) {
        throw new MyError(404, `TTBA sudah terdaftar pada rak`);
      }

      const result = await request.query(
        `INSERT INTO t_pemetaan_gudang (Lokasi, Rak, Baris, Kolom, Item_Name, Qty, DNc_No, Item_ID, Process_Date, DNc_TTBANo, Status) 
            VALUES ('${loc}', '${rak}', '${row}', '${col}', '${Item_Name}', ${newQty}, '${formatDNc_No}', '${formatItem_ID}', '${Process_Date}', '${ttba_scanned}', 'Karantina');`
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
            flag: "INSERTED",
            status: "Karantina",
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
            flag: "INSERTED",
            status: "Karantina",
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

  static async insertBulkProductToRack(req, res, next) {
    let t = await sequelize.transaction();
    try {
      const { loc, rak, row, col } = req.params;
      const product = req.body; // Assuming the new quantity is sent in the request body
      const location = `${loc}/${rak}/${row}/${col}`;

      // console.log(req.body, "ini body Insertbulk");
      // console.log(req.params, "ini params Insertbulk");
      const str = product
        .map((item) => {
          const {
            No_analisa,
            TTBA_No,
            TTBA_SeqID,
            ttba_vatno,
            ttba_itemid,
            item_name,
            TTBA_qty_per_Vat,
            ttba_date,
          } = item;

          const qtyPerVatFloat = parseFloat(TTBA_qty_per_Vat);

          return `('${loc}','${rak}','${row}','${col}','${No_analisa}','${TTBA_No}#${TTBA_SeqID}#${ttba_vatno}','${ttba_itemid}','${item_name}',${qtyPerVatFloat},'${ttba_date}')`;
        })
        .join(" , ");

      const ttbaScannedList = product.map((item) => {
        const { TTBA_No, TTBA_SeqID, ttba_vatno } = item;
        return `${TTBA_No}#${TTBA_SeqID}#${ttba_vatno}`;
      });

      console.log(ttbaScannedList, "ini ttbaScannedList");
      // console.log(str, "ini str");
      const pool = await sql.connect(config);
      const request = pool.request();

      //   const dataFound = await request.query(
      //   `SELECT * FROM t_pemetaan_gudang
      //   WHERE DNc_TTBANo IN (${ttbaScannedList});`
      // );
      // let req = new sql.Request();
      ttbaScannedList.forEach((ttba, index) => {
        request.input(`ttba${index}`, ttba);
      });
      const query = `
  SELECT * FROM t_pemetaan_gudang
  WHERE DNc_TTBANo IN (${ttbaScannedList
    .map((_, index) => `@ttba${index}`)
    .join(", ")})
`;

      const dataFound = await request.query(query);
      console.log(dataFound, "dataFound di insertBulkProductToRack");
      if (dataFound.recordset.length > 0) {
        throw new MyError(
          400,
          `Product ${dataFound.recordset[0].DNc_TTBANo} sudah terdaftar`
        );
      }

      const result = await request.query(
        `INSERT INTO t_pemetaan_gudang (Lokasi, Rak, Baris, Kolom, DNc_No, DNc_TTBANo, Item_ID, Item_Name, Qty, Process_Date) 
            VALUES ${str};`
      );
      if (result.length === 0) throw new MyError(404, "Rack Not Found");

      const mappedProducts = product.map((p) => ({
        lokasi: location, // or any other value that should be mapped to 'lokasi'
        ttba_no: p?.TTBA_No,
        DNc_no: p?.No_analisa,
        DNc_TtbaNo: p?.TTBA_No + "#" + p?.TTBA_SeqID + "#" + p?.ttba_vatno,
        seq_id: p?.TTBA_SeqID,
        item_name: p?.item_name,
        item_id: p?.ttba_itemid,
        qty_ttba: p?.ttba_qty,
        ttba_itemUnit: p?.ttba_itemUnit,
        qty_per_vat: p?.TTBA_qty_per_Vat,
        qty_less: 0,
        vat_no: p?.ttba_vatno,
        vat_qty: p?.TTBA_VATQTY,
        user_id: "test",
        delegated_to: "test",
        flag: "INSERTED",
      }));
      await t_pemetaan_gudang_detail.bulkCreate(mappedProducts, {
        transaction: t,
      });

      await t.commit();
      res.status(200).json({
        message: "Product added successfully",
      });
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
      const formatDNc_No = req.params.DNc_No.replace(/%2f/g, "/");
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
      if (result.length === 0) throw new MyError(404, "Rack Not Found");
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
          flag: "MOVED (G)",
        },
        { transaction: t }
      );
      await t.commit();
      res.status(200).json({
        message: "Product added successfully",
      });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  }

  //insert table position
  static async insertStockPosition(req, res, next) {
    let t = await sequelize.transaction();
    try {
      const { DNc_No, vat_no } = req.params;
      const { product, rack, scanned } = req.body; // Assuming the new quantity is sent in the request body

      // const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const formatDNc_No = req.params.DNc_No.replace(/%2F/g, "/");
      const Item_ID = product.ttba_itemid;
      const ttba = product.TTBA_No;
      const seq_id = product.TTBA_SeqID;
      const Item_Name = product.item_name;
      const ttba_itemUnit = product.ttba_itemUnit;
      const qty_ttba = product.ttba_qty;
      const qty_per_vat = product.TTBA_qty_per_Vat;
      const process_date = new Date();
      const vat_qty = product.TTBA_VATQTY;

      // const formatTtba = ttba_no.replace(/-/g, "/");
      const location = `${rack.Lokasi}/${rack.Rak}/${rack.Baris}/${rack.Kolom}`;
      // const qty_per_vat = qty_ttba / vat_qty;
      // const qty_less = qty_ttba - newQty;

      console.log(req.body, "ini body");
      console.log(req.params, "ini params");
      console.log(formatDNc_No);
      console.log(Item_ID);
      console.log(process_date);
      console.log(vat_no);
      // if (!loc || !rak || !row || !col || !Item_Name || !newQty) {
      //   return res.status(400).send("Missing required fields");
      // }
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

      // const detailFoundLatest = await t_pemetaan_gudang_detail.findOne({
      //   where: {
      //     ttba_no: formatTtba,
      //     seq_id: String(seq_id),
      //   },
      //   order: [["createdAt", "DESC"]],
      // });
      // console.log(detailFoundLatest, "detailFoundLatest");

      const pool = await sql.connect(config);
      const request = pool.request();

      request.input("process_date", sql.DateTime, new Date());

      const result = await request.query(
        `INSERT INTO t_item_stock_position_dnc_kecil (Dnc_No, Item_ID, Vat_no, Qty, process_date, User_ID, Delegated_to, flag_update) 
            VALUES ('${formatDNc_No}', '${Item_ID}', ${vat_no}, ${qty_per_vat}, @process_date, 'test', 'test', 'Created (G)');`
      );
      if (result.length === 0) throw new MyError(404, "Rack Not Found");
      const recordset = result?.recordset;

      await t_pemetaan_gudang_detail.create(
        {
          lokasi: location,
          ttba_no: ttba,
          DNc_no: formatDNc_No,
          DNc_TtbaNo: scanned,
          seq_id,
          item_name: Item_Name,
          item_id: Item_ID,
          qty_ttba,
          ttba_itemUnit,
          qty_per_vat,
          qty_less: qty_per_vat,
          vat_no,
          vat_qty,
          user_id: "test",
          delegated_to: "test",
          flag: "INSERTED (GS)",
        },
        { transaction: t }
      );
      await t.commit();
      res.status(200).json({
        message: "Product added successfully",
      });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  }

  static async insertTimbangToGudang(req, res, next) {
    let t = await sequelize.transaction();
    try {
      console.log(req.body, "ini body insertTimbangToGudang");
      const { recordsetTtba, recordsetStockPosition } = req.body;
      const { loc, rak, row, col, ttbaScanned } = req.params;
      const formatTtbaScanned = ttbaScanned
        .replace(/%2F/g, "/")
        .replace(/%23/g, "#");
      const DNc_No = recordsetTtba.No_analisa;
      const Item_ID = recordsetTtba.ttba_itemid;
      const ttba = recordsetTtba.TTBA_No;
      const seq_id = recordsetTtba.TTBA_SeqID;
      const Item_Name = recordsetTtba.item_name;
      const ttba_itemUnit = recordsetTtba.ttba_itemUnit;
      const qty_ttba = recordsetTtba.ttba_qty;
      const qty_per_vat = recordsetStockPosition.Qty;
      const process_date = new Date();
      const vat_no = recordsetTtba.ttba_vatno;
      const vat_qty = recordsetTtba.TTBA_VATQTY;
      const location = `${loc}/${rak}/${row}/${col}`;

      const pool = await sql.connect(config);
      const request = pool.request();

      request.input("process_date", sql.DateTime, new Date());

      const insert = await request.query(
        `INSERT INTO t_pemetaan_gudang (Lokasi, Rak, Baris, Kolom, Item_Name, Qty, DNc_No, Item_ID, Process_Date, DNc_TTBANo) 
            VALUES ('${loc}', '${rak}', '${row}', '${col}', '${Item_Name}', ${qty_per_vat}, '${DNc_No}', '${Item_ID}', @process_date, '${formatTtbaScanned}');`
      );
      if (insert.length === 0) throw new MyError(404, "Rack Not Found");

      const deleteStockPosition = await request.query(
        `DELETE FROM t_item_stock_position_dnc_kecil
        WHERE Dnc_no = '${DNc_No}' AND Vat_no = ${vat_no};`
      );
      if (deleteStockPosition.length === 0)
        throw new MyError(404, "Stock Position Not Found");

      await t_pemetaan_gudang_detail.create(
        {
          lokasi: location,
          ttba_no: ttba,
          DNc_no: DNc_No,
          DNc_TtbaNo: formatTtbaScanned,
          seq_id,
          item_name: Item_Name,
          item_id: Item_ID,
          qty_ttba,
          ttba_itemUnit,
          qty_per_vat,
          qty_less: 0,
          vat_no,
          vat_qty,
          user_id: "test",
          delegated_to: "test",
          flag: "INSERTED (SG)",
        },
        { transaction: t }
      );
      await t.commit();
      res.status(200).json({
        message: "Product added successfully",
      });
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
      const formatDNc_No = req.params.DNc_No.replace(/%2f/g, "/");
      const formatTtbaDNcNo = req.params.ttbaScanned.replace(/%2F/g, "/");

      // cons= ttba_no.replace(/-/g, "/");
      const pool = await sql.connect(config);
      const request = pool.request();
      // console.log(req.params);

      const result = await request.query(
        `DELETE FROM t_pemetaan_gudang 
        WHERE Lokasi = '${loc}' AND Rak = '${rak}' AND Baris = '${row}' AND Kolom = '${col}' AND Item_ID = '${formatItem_ID}' AND DNc_No = '${formatDNc_No}' AND DNc_TTBANo = '${formatTtbaDNcNo}';`
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
          flag: "DELETED (G)",
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

  //delete table pemetaan gudang by ttba withdraw
  static async deletePemetaanByTtba(req, res, next) {
    let t = await sequelize.transaction();
    try {
      const { ttbaScanned } = req.params;
      const { product, rack, scanned } = req.body; // Assuming the new quantity is sent in the request body

      // const formatItem_ID = req.params.Item_ID.replace(/_/g, " ");
      const DNc_No = product.No_analisa;
      const Item_ID = product.ttba_itemid;
      const ttba = product.TTBA_No;
      const seq_id = product.TTBA_SeqID;
      const Item_Name = product.item_name;
      const ttba_itemUnit = product.ttba_itemUnit;
      const qty_ttba = product.ttba_qty;
      const qty_per_vat = product.TTBA_qty_per_Vat;
      const process_date = new Date();
      const vat_no = product.ttba_vatno;
      const vat_qty = product.TTBA_VATQTY;

      // const formatTtba = ttba_no.replace(/-/g, "/");
      const location = `${rack.Lokasi}/${rack.Rak}/${rack.Baris}/${rack.Kolom}`;
      // const qty_per_vat = qty_ttba / vat_qty;
      // const qty_less = qty_ttba - newQty;

      console.log(req.body, "ini body");
      console.log(req.params, "ini params");

      // if (!loc || !rak || !row || !col || !Item_Name || !newQty) {
      //   return res.status(400).send("Missing required fields");
      // }
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

      // const detailFoundLatest = await t_pemetaan_gudang_detail.findOne({
      //   where: {
      //     ttba_no: formatTtba,
      //     seq_id: String(seq_id),
      //   },
      //   order: [["createdAt", "DESC"]],
      // });
      // console.log(detailFoundLatest, "detailFoundLatest");

      const pool = await sql.connect(config);
      const request = pool.request();

      const result = await request.query(
        `DELETE FROM t_pemetaan_gudang 
        WHERE DNc_TTBANo = '${scanned}';`
      );
      console.log(result, "recordset1 delete");
      if (!result) throw new MyError(404, "Product Not Found");
      const recordset = result?.recordset;

      await t_pemetaan_gudang_detail.create(
        {
          lokasi: location,
          ttba_no: ttba,
          DNc_no: DNc_No,
          DNc_TtbaNo: scanned,
          seq_id,
          item_name: Item_Name,
          item_id: Item_ID,
          qty_ttba,
          ttba_itemUnit,
          qty_per_vat,
          qty_less: qty_per_vat, // kudu di cek lagi
          vat_no,
          vat_qty,
          user_id: "test",
          delegated_to: "test",
          flag: "DELETED (G)",
        },
        { transaction: t }
      );
      await t.commit();
      res.status(200).json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  }
}

module.exports = MsqlController;
