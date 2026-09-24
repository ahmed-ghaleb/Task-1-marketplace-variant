import { Listing } from '../models/Listing.js';
import Joi from 'joi';
import mongoose from 'mongoose';

const createListingSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().optional(),
  price: Joi.number().min(0).required(),
  category: Joi.string()
    .valid('textbooks', 'electronics', 'furniture', 'clothing', 'other')
    .optional(),
  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'worn')
    .optional(),
  status: Joi.string()
    .valid('active', 'sold', 'removed')
    .optional(),
  seller: Joi.string().hex().length(24).optional()
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().trim(),
  price: Joi.number().min(0),
  category: Joi.string()
    .valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string()
    .valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
}).min(1);

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

export async function getAllListings(req, res, next) {
  try {
    const filter = {};

    if (req.query.includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name email')
      .lean();

    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

export async function getListing(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const filter = { _id: req.params.id };

    if (req.query.includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }

    const listing = await Listing.findOne(filter)
      .populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

export async function createListing(req, res, next) {
  try {
    const { error, value } = createListingSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const listing = await Listing.create(value);
    await listing.populate('seller', 'name email');

    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

export async function updateListing(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const { error, value } = updateListingSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

export async function deleteListing(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

export async function markListingSold(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const listing = await Listing.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "active",
      },
      {
        status: "sold",
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("seller", "name email");

    if (!listing) {
      return res.status(404).json({
        message: "Active listing not found",
      });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}
