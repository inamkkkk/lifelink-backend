const express = require('express');
const { registerHospital, getHospitalDetails } = require('../controllers/hospitalController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, registerHospitalSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Only system admin can register new hospitals
router.post('/register', protect, authorizeRoles('system_admin'), validate(registerHospitalSchema), registerHospital);
router.get('/:id', protect, authorizeRoles('system_admin', 'hospital_admin'), getHospitalDetails);

module.exports = router;