const BloodInventory = require('../models/BloodInventory');
const Hospital = require('../models/Hospital');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('./notificationService');

exports.getHospitalInventory = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  const inventory = await BloodInventory.find({ hospitalId });
  return inventory;
};

exports.updateInventory = async (hospitalId, bloodType, updateData) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  let inventoryItem = await BloodInventory.findOneAndUpdate(
    { hospitalId, bloodType },
    { $set: { quantity: updateData.quantity, expiryDate: updateData.expiryDate, lastUpdated: Date.now() } },
    { new: true, upsert: true, runValidators: true }
  );

  if (!inventoryItem) {
    // This case should ideally not happen with upsert:true unless there's a validation error on creation.
    throw new ErrorResponse('Could not update/create inventory item', 500);
  }

  // TODO: Implement low stock notifications
  if (inventoryItem.quantity < 2000 && updateData.quantity > 0) { // Example threshold: < 2000ml
    await notificationService.sendNotification(
      hospital.admins[0], // Notify first admin
      `Low stock alert: Blood type ${bloodType} at ${hospital.name} is ${inventoryItem.quantity}ml.`,
      'alert'
    );
  }

  return inventoryItem;
};

// TODO: Add methods for adding/removing specific blood units, managing expiry, etc.
