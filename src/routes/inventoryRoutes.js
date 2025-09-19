const express = require('express');
const { getHospitalInventory, updateInventory } = require('../controllers/inventoryController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, updateInventorySchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Hospital admin or system admin can view inventory
router.get('/:hospitalId', protect, authorizeRoles('hospital_admin', 'system_admin'), getHospitalInventory);

// Hospital admin or system admin can update inventory
// TODO: Refactor the update route to be more RESTful.
// Consider changing '/update' to a more specific resource path if applicable,
// or simply updating the resource identified by hospitalId.
// For now, keeping the existing path structure as per the original code,
// but a future refactor might involve something like router.put('/:hospitalId', ...).
router.put('/:hospitalId', protect, authorizeRoles('hospital_admin', 'system_admin'), validate(updateInventorySchema), updateInventory);

module.exports = router;