const Hospital = require('../models/Hospital');
const User = require('../models/User'); // To check for admin users
const ErrorResponse = require('../utils/errorResponse');
const { geocodeAddress } = require('../utils/geoUtils');

exports.registerHospital = async (hospitalData) => {
  if (hospitalData.address && typeof hospitalData.address === 'string') {
    // Assuming geocodeAddress returns an object with lat and lng properties
    const geoData = await geocodeAddress(hospitalData.address);
    if (geoData && geoData.lat && geoData.lng) {
      hospitalData.location = {
        type: 'Point',
        coordinates: [geoData.lng, geoData.lat],
        formattedAddress: geoData.formattedAddress || hospitalData.address,
      };
    } else {
      throw new ErrorResponse('Could not geocode provided address for hospital', 400);
    }
  }

  // Validate admins if provided
  if (hospitalData.admins && Array.isArray(hospitalData.admins) && hospitalData.admins.length > 0) {
    // Ensure all provided admin IDs are valid MongoDB ObjectIds before querying
    const validAdminIds = hospitalData.admins.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validAdminIds.length !== hospitalData.admins.length) {
      throw new ErrorResponse('One or more provided admin IDs are not valid ObjectIds', 400);
    }

    const existingAdmins = await User.find({ _id: { $in: validAdminIds }, role: 'hospital_admin' });
    if (existingAdmins.length !== validAdminIds.length) {
      const foundAdminIds = existingAdmins.map(admin => admin._id.toString());
      const missingAdminIds = validAdminIds.filter(id => !foundAdminIds.includes(id));
      throw new ErrorResponse(`One or more provided admin IDs are invalid or not hospital_admins: ${missingAdminIds.join(', ')}`, 400);
    }
  }

  const hospital = await Hospital.create(hospitalData);
  return hospital;
};

exports.getHospitalDetails = async (hospitalId) => {
  // Ensure hospitalId is a valid ObjectId before querying
  if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
    throw new ErrorResponse('Invalid hospital ID format', 400);
  }

  const hospital = await Hospital.findById(hospitalId).populate('admins', 'fullName email');
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }
  return hospital;
};

exports.updateHospital = async (hospitalId, hospitalData) => {
  if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
    throw new ErrorResponse('Invalid hospital ID format', 400);
  }

  if (hospitalData.address && typeof hospitalData.address === 'string') {
    const geoData = await geocodeAddress(hospitalData.address);
    if (geoData && geoData.lat && geoData.lng) {
      hospitalData.location = {
        type: 'Point',
        coordinates: [geoData.lng, geoData.lat],
        formattedAddress: geoData.formattedAddress || hospitalData.address,
      };
    } else {
      throw new ErrorResponse('Could not geocode provided address for hospital', 400);
    }
  }

  // Validate admins if provided for update
  if (hospitalData.admins && Array.isArray(hospitalData.admins) && hospitalData.admins.length > 0) {
    const validAdminIds = hospitalData.admins.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validAdminIds.length !== hospitalData.admins.length) {
      throw new ErrorResponse('One or more provided admin IDs are not valid ObjectIds', 400);
    }

    const existingAdmins = await User.find({ _id: { $in: validAdminIds }, role: 'hospital_admin' });
    if (existingAdmins.length !== validAdminIds.length) {
      const foundAdminIds = existingAdmins.map(admin => admin._id.toString());
      const missingAdminIds = validAdminIds.filter(id => !foundAdminIds.includes(id));
      throw new ErrorResponse(`One or more provided admin IDs are invalid or not hospital_admins: ${missingAdminIds.join(', ')}`, 400);
    }
  }

  const hospital = await Hospital.findByIdAndUpdate(hospitalId, hospitalData, {
    new: true, // Return the modified document
    runValidators: true, // Run schema validators
  });

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  return hospital;
};

exports.deleteHospital = async (hospitalId) => {
  if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
    throw new ErrorResponse('Invalid hospital ID format', 400);
  }

  const hospital = await Hospital.findByIdAndDelete(hospitalId);

  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  // Optionally, you might want to disassociate admins or handle other related data
  // For now, we just return success.

  return { message: 'Hospital deleted successfully' };
};

exports.addAdminToHospital = async (hospitalId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
    throw new ErrorResponse('Invalid hospital ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ErrorResponse('Invalid admin ID format', 400);
  }

  // Check if the admin is a valid hospital admin
  const adminUser = await User.findById(adminId);
  if (!adminUser) {
    throw new ErrorResponse('Admin user not found', 404);
  }
  if (adminUser.role !== 'hospital_admin') {
    throw new ErrorResponse('User is not a hospital admin', 400);
  }

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  if (hospital.admins.includes(adminId)) {
    throw new ErrorResponse('Admin is already associated with this hospital', 400);
  }

  hospital.admins.push(adminId);
  await hospital.save();

  return hospital;
};

exports.removeAdminFromHospital = async (hospitalId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
    throw new ErrorResponse('Invalid hospital ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ErrorResponse('Invalid admin ID format', 400);
  }

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  const adminIndex = hospital.admins.indexOf(adminId);
  if (adminIndex === -1) {
    throw new ErrorResponse('Admin not found in this hospital', 404);
  }

  hospital.admins.splice(adminIndex, 1);
  await hospital.save();

  return hospital;
};

// Helper to ensure mongoose is available for ObjectId validation
const mongoose = require('mongoose');