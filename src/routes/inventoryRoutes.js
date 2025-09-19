const express = require('express');
const { getHospitalInventory, updateInventory } = require('../controllers/inventoryController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, updateInventorySchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Hospital admin or system admin can view inventory
router.get('/:hospitalId', protect, authorizeRoles('hospital_admin', 'system_admin'), getHospitalInventory);
// Hospital admin or system admin can update inventory
router.put('/:hospitalId/update', protect, authorizeRoles('hospital_admin', 'system_admin'), validate(updateInventorySchema), updateInventory);

module.exports = router;
