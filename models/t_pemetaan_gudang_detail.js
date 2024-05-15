'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class t_pemetaan_gudang_detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  t_pemetaan_gudang_detail.init({
    lokasi: DataTypes.STRING,
    ttba_no: DataTypes.STRING,
    item_id: DataTypes.STRING,
    user_id: DataTypes.STRING,
    delegated_to: DataTypes.STRING,
    flag: DataTypes.STRING
  }, {
    sequelize,
    modelName: 't_pemetaan_gudang_detail',
  });
  return t_pemetaan_gudang_detail;
};