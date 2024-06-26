'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('t_pemetaan_gudang_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      lokasi: {
        type: Sequelize.STRING
      },
      ttba_no: {
        type: Sequelize.STRING
      },
      DNc_no: {
        type: Sequelize.STRING
      },
      DNc_TtbaNo: {
        type: Sequelize.STRING
      },
      seq_id: {
        type: Sequelize.STRING
      },
      item_name: { 
        type: Sequelize.STRING
      },
      item_id: {
        type: Sequelize.STRING
      },
      qty_ttba: {
        type: Sequelize.INTEGER
      },
      ttba_itemUnit: {
        type: Sequelize.STRING
      },
      qty_per_vat: {
        type: Sequelize.INTEGER
      },
      qty_less: {
        type: Sequelize.INTEGER
      },
      vat_no: {
        type: Sequelize.INTEGER
      },
      vat_qty: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      user_id: {
        type: Sequelize.STRING
      },
      delegated_to: {
        type: Sequelize.STRING
      },
      flag: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('t_pemetaan_gudang_details');
  }
};