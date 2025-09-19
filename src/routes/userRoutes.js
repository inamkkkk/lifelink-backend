const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, registerUserSchema, loginUserSchema, updateUserSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

router.post('/register', validate(registerUserSchema), registerUser);
router.post('/login', validate(loginUserSchema), loginUser);
router.get('/:id', protect, getUserProfile); // Can be /users/me or /users/:id
router.put('/:id', protect, validate(updateUserSchema), updateUserProfile); // Can be /users/me or /users/:id

module.exports = router;
