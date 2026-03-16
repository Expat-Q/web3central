const express = require('express');
const Spotlight = require('../models/Spotlight');
const { protect, admin } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../errors');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const spotlight = await Spotlight.findOne();
  if (!spotlight) {
    throw AppError.notFound('Spotlight data');
  }
  res.json(spotlight);
}));

router.put('/', protect, asyncHandler(async (req, res) => {
  const updatedData = req.body;

  let spotlight = await Spotlight.findOne();

  if (!spotlight) {
    spotlight = await Spotlight.create(updatedData);
    return res.json({ success: true, message: 'Community spotlight created', spotlight });
  }

  const updatedSpotlight = await Spotlight.findByIdAndUpdate(
    spotlight._id,
    updatedData,
    { new: true, runValidators: true }
  );

  res.json({ success: true, message: 'Community spotlight updated successfully', spotlight: updatedSpotlight });
}));

router.post('/projects', protect, asyncHandler(async (req, res) => {
  const newProject = req.body;

  const spotlight = await Spotlight.findOne();
  if (!spotlight) {
    throw AppError.notFound('Spotlight data');
  }

  spotlight.projects.push(newProject);
  await spotlight.save();

  res.status(201).json({ success: true, message: 'Project added successfully', project: newProject });
}));

router.put('/projects/:id', protect, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const updatedProject = req.body;

  const spotlight = await Spotlight.findOne();
  if (!spotlight) {
    throw AppError.notFound('Spotlight data');
  }

  const projectIndex = spotlight.projects.findIndex(project => project.id === id);
  if (projectIndex === -1) {
    throw AppError.notFound('Project');
  }

  spotlight.projects[projectIndex] = { ...spotlight.projects[projectIndex].toObject(), ...updatedProject };
  await spotlight.save();

  res.json({ success: true, message: 'Project updated successfully', project: spotlight.projects[projectIndex] });
}));

router.delete('/projects/:id', protect, asyncHandler(async (req, res) => {
  const id = req.params.id;

  const spotlight = await Spotlight.findOne();
  if (!spotlight) {
    throw AppError.notFound('Spotlight data');
  }

  spotlight.projects = spotlight.projects.filter(project => project.id !== id);
  await spotlight.save();

  res.json({ success: true, message: 'Project removed successfully' });
}));

module.exports = router;