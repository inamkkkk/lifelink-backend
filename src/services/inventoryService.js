const BloodInventory = require('../models/BloodInventory');
const Hospital = require('../models/Hospital');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('./notificationService');

/**
 * Retrieves the blood inventory for a specific hospital.
 * @param {string} hospitalId - The ID of the hospital.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of inventory items.
 * @throws {ErrorResponse} If the hospital is not found.
 */
exports.getHospitalInventory = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  const inventory = await BloodInventory.find({ hospitalId });
  return inventory;
};

/**
 * Updates the quantity and expiry date of a specific blood type in the inventory.
 * If the item doesn't exist, it creates it.
 * @param {string} hospitalId - The ID of the hospital.
 * @param {string} bloodType - The type of blood (e.g., 'A+', 'O-').
 * @param {object} updateData - An object containing the update data.
 * @param {number} updateData.quantity - The new quantity of the blood type.
 * @param {Date} updateData.expiryDate - The expiry date of the blood.
 * @returns {Promise<object>} A promise that resolves to the updated inventory item.
 * @throws {ErrorResponse} If the hospital is not found or if there's an issue updating/creating the inventory.
 */
exports.updateInventory = async (hospitalId, bloodType, updateData) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  // Ensure updateData contains necessary fields and valid types
  if (typeof updateData.quantity !== 'number' || updateData.quantity < 0) {
    throw new ErrorResponse('Invalid quantity provided', 400);
  }
  if (!(updateData.expiryDate instanceof Date) || isNaN(updateData.expiryDate.getTime())) {
    throw new ErrorResponse('Invalid expiry date provided', 400);
  }

  let inventoryItem = await BloodInventory.findOneAndUpdate(
    { hospitalId, bloodType },
    {
      $set: {
        quantity: updateData.quantity,
        expiryDate: updateData.expiryDate,
        lastUpdated: Date.now()
      }
    },
    { new: true, upsert: true, runValidators: true }
  );

  // If upsert created a new document, inventoryItem would be populated.
  // This check is more for ensuring updateData adheres to schema if upsert is used for creation.
  if (!inventoryItem) {
    throw new ErrorResponse('Could not update/create inventory item due to validation errors or other issues.', 500);
  }

  // TODO: Implement low stock notifications - Consider making threshold configurable.
  const LOW_STOCK_THRESHOLD = 2000; // Example threshold in ml.
  if (inventoryItem.quantity < LOW_STOCK_THRESHOLD && updateData.quantity >= 0 && inventoryItem.quantity > 0) { // Trigger notification if stock drops below threshold and quantity is still positive.
    // Ensure there's at least one admin to notify.
    if (hospital.admins && hospital.admins.length > 0) {
      await notificationService.sendNotification(
        hospital.admins[0], // Notify first admin
        `Low stock alert: Blood type ${bloodType} at ${hospital.name} is now at ${inventoryItem.quantity}ml.`,
        'alert'
      );
    } else {
      console.warn(`Hospital ${hospitalId} has no admins to send low stock alert for ${bloodType}.`);
    }
  }

  // TODO: Implement high stock alerts if needed.

  return inventoryItem;
};

/**
 * Adds a specific number of blood units to the inventory.
 * @param {string} hospitalId - The ID of the hospital.
 * @param {string} bloodType - The type of blood.
 * @param {number} quantityToAdd - The quantity of blood units to add.
 * @param {Date} expiryDate - The expiry date of the added blood.
 * @returns {Promise<object>} A promise that resolves to the updated inventory item.
 * @throws {ErrorResponse} If the hospital is not found, quantity is invalid, or there's an issue.
 */
exports.addBloodUnits = async (hospitalId, bloodType, quantityToAdd, expiryDate) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  if (typeof quantityToAdd !== 'number' || quantityToAdd <= 0) {
    throw new ErrorResponse('Quantity to add must be a positive number.', 400);
  }
  if (!(expiryDate instanceof Date) || isNaN(expiryDate.getTime())) {
    throw new ErrorResponse('Invalid expiry date provided', 400);
  }

  let inventoryItem = await BloodInventory.findOne({ hospitalId, bloodType });

  if (inventoryItem) {
    inventoryItem.quantity += quantityToAdd;
    // Consider how to handle expiry dates if adding different batches.
    // For simplicity, this assumes adding units with the same expiry date or updating if a newer one exists.
    if (expiryDate > inventoryItem.expiryDate) {
      inventoryItem.expiryDate = expiryDate;
    }
    inventoryItem.lastUpdated = Date.now();
    await inventoryItem.save();
  } else {
    inventoryItem = new BloodInventory({
      hospitalId,
      bloodType,
      quantity: quantityToAdd,
      expiryDate,
      lastUpdated: Date.now(),
    });
    await inventoryItem.save();
  }

  // Potentially trigger notifications if adding units pushes stock above a certain level, or if expiry is updated.

  return inventoryItem;
};

/**
 * Removes a specific number of blood units from the inventory.
 * @param {string} hospitalId - The ID of the hospital.
 * @param {string} bloodType - The type of blood.
 * @param {number} quantityToRemove - The quantity of blood units to remove.
 * @returns {Promise<object>} A promise that resolves to the updated inventory item.
 * @throws {ErrorResponse} If the hospital is not found, quantity is invalid, not enough stock, or there's an issue.
 */
exports.removeBloodUnits = async (hospitalId, bloodType, quantityToRemove) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  if (typeof quantityToRemove !== 'number' || quantityToRemove <= 0) {
    throw new ErrorResponse('Quantity to remove must be a positive number.', 400);
  }

  let inventoryItem = await BloodInventory.findOne({ hospitalId, bloodType });

  if (!inventoryItem) {
    throw new ErrorResponse(`Blood type ${bloodType} not found in inventory for hospital ${hospitalId}.`, 404);
  }

  if (inventoryItem.quantity < quantityToRemove) {
    throw new ErrorResponse(`Insufficient stock for blood type ${bloodType}. Available: ${inventoryItem.quantity}, Requested: ${quantityToRemove}.`, 400);
  }

  inventoryItem.quantity -= quantityToRemove;
  inventoryItem.lastUpdated = Date.now();

  // If quantity becomes zero, you might consider removing the entry or keeping it with zero quantity.
  // For now, we keep it.
  await inventoryItem.save();

  // Potentially trigger low stock notifications here if removal causes stock to drop below threshold.
  const LOW_STOCK_THRESHOLD = 2000;
  if (inventoryItem.quantity < LOW_STOCK_THRESHOLD && inventoryItem.quantity > 0) {
    if (hospital.admins && hospital.admins.length > 0) {
      await notificationService.sendNotification(
        hospital.admins[0],
        `Low stock alert: Blood type ${bloodType} at ${hospital.name} is now at ${inventoryItem.quantity}ml.`,
        'alert'
      );
    } else {
      console.warn(`Hospital ${hospitalId} has no admins to send low stock alert for ${bloodType} after removal.`);
    }
  }

  return inventoryItem;
};

/**
 * Manages expired blood units. This could involve marking them as expired or removing them.
 * @param {string} hospitalId - The ID of the hospital.
 * @returns {Promise<object>} A promise that resolves to the status of expired units management.
 * @throws {ErrorResponse} If the hospital is not found or there's an issue.
 */
exports.manageExpiredBlood = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  const now = new Date();
  // Find all inventory items whose expiry date is in the past.
  const expiredItems = await BloodInventory.find({
    hospitalId,
    expiryDate: { $lt: now },
  });

  if (expiredItems.length === 0) {
    return { message: 'No expired blood found to manage.', expiredCount: 0 };
  }

  // Option 1: Remove expired items from the inventory.
  const deleteResult = await BloodInventory.deleteMany({
    hospitalId,
    expiryDate: { $lt: now },
  });

  // Option 2: Alternatively, you could update a status field on the inventory item
  // e.g., inventoryItem.status = 'expired'; inventoryItem.save();
  // This would allow tracking of disposed quantities.

  // Log or notify about expired units if needed.
  console.log(`Managed expired blood for hospital ${hospitalId}. Removed ${deleteResult.deletedCount} units.`);

  // Potentially send a summary notification about disposed expired blood.

  return {
    message: 'Expired blood units managed.',
    expiredCount: deleteResult.deletedCount,
    // You might want to return details of what was expired if needed.
  };
};

// TODO: Add methods for managing blood expiry dates more granularly (e.g., re-testing, extending if possible).
// TODO: Add methods to fetch blood by expiry date range (e.g., nearing expiry).
// TODO: Consider implementing batch tracking if different expiry dates for the same blood type are common.