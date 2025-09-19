const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, registerUserSchema, loginUserSchema, updateUserSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// @route   POST /api/v1/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', validate(registerUserSchema), registerUser);

// @route   POST /api/v1/users/login
// @desc    Login a user
// @access  Public
router.post('/login', validate(loginUserSchema), loginUser);

// @route   GET /api/v1/users/me
// @desc    Get logged in user profile
// @access  Private
// TODO: Consider if /users/me is more appropriate than /users/:id for the logged-in user.
// The current implementation uses :id, which might allow fetching any user's profile if not protected correctly.
// For now, we'll keep the :id as per the original code, assuming `protect` middleware handles authorization.
router.get('/:id', protect, getUserProfile);

// @route   PUT /api/v1/users/me
// @desc    Update logged in user profile
// @access  Private
// TODO: Consider if /users/me is more appropriate than /users/:id for updating the logged-in user.
// Similar to the GET route, we'll keep :id for now.
router.put('/:id', protect, validate(updateUserSchema), updateUserProfile);

module.exports = router;