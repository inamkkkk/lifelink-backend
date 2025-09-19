const Hospital = require('../models/Hospital');
const User = require('../models/User'); // To check for admin users
const ErrorResponse = require('../utils/errorResponse');
const { geocodeAddress } = require('../utils/geoUtils');

exports.registerHospital = async (hospitalData) => {
  if (hospitalData.location && typeof hospitalData.location === 'string') {
    const geoData = await geocodeAddress(hospitalData.location);
    if (geoData) {
      hospitalData.location = geoData;
    } else {
      throw new ErrorResponse('Could not geocode provided location for hospital', 400);
    }
  }

  // Validate admins if provided
  if (hospitalData.admins && hospitalData.admins.length > 0) {
    const existingAdmins = await User.find({ _id: { $in: hospitalData.admins }, role: 'hospital_admin' });
    if (existingAdmins.length !== hospitalData.admins.length) {
      throw new ErrorResponse('One or more provided admin IDs are invalid or not hospital_admins', 400);
    }
  }

  const hospital = await Hospital.create(hospitalData);
  return hospital;
};

exports.getHospitalDetails = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId).populate('admins', 'fullName email');
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }
  return hospital;
};

// TODO: Implement updateHospital, deleteHospital, addAdminToHospital, etc.
