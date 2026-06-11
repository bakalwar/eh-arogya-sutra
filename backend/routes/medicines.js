const express = require('express');
const { Op } = require('sequelize');
const { requireMedicinesDb } = require('../middleware/requireDb');
const { asyncHandler } = require('../utils/asyncHandler');
const { getPostgresModels } = require('../utils/dataSource');

const router = express.Router();

router.use(requireMedicinesDb);

function escapeIlike(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}

function medicineToApi(row) {
  const u = row.get({ plain: true });
  return {
    id: String(u.id),
    name: u.name,
    system: u.system,
    polarityHint: u.polarity_hint || undefined,
    medicineGroup: u.medicine_group || undefined,
    dilution: u.dilution || undefined,
    indications: u.indications || undefined,
    createdAt: u.created_at
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { MedicinePg } = getPostgresModels();
    const medicines = await MedicinePg.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: medicines.map((m) => medicineToApi(m)) });
  })
);

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { MedicinePg } = getPostgresModels();
    const q = (req.query.query || '').toString().trim();

    if (!q) {
      const medicines = await MedicinePg.findAll({
        order: [['name', 'ASC']],
        limit: 50
      });
      return res.json({ success: true, data: medicines.map((m) => medicineToApi(m)) });
    }

    const safe = escapeIlike(q);
    const pattern = `%${safe}%`;
    const medicines = await MedicinePg.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: pattern } },
          { system: { [Op.iLike]: pattern } },
          { medicine_group: { [Op.iLike]: pattern } },
          { dilution: { [Op.iLike]: pattern } },
          { indications: { [Op.iLike]: pattern } }
        ]
      },
      order: [['name', 'ASC']],
      limit: 50
    });
    res.json({ success: true, data: medicines.map((m) => medicineToApi(m)) });
  })
);

module.exports = router;
