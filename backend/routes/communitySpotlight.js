const express = require('express');
const Spotlight = require('../models/Spotlight');
const { protect, admin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// GET community spotlight
router.get('/', async (req, res) => {
  try {
    const spotlight = await Spotlight.findOne();
    if (!spotlight) {
      return res.status(404).json({ success: false, message: 'Spotlight data not found' });
    }
    res.json({ success: true, data: spotlight });
  } catch (error) {
    console.error('Get spotlight error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch spotlight' });
  }
});

// PUT update community spotlight (Admin only)
router.put('/', protect, admin, async (req, res) => {
  try {
    const updatedData = req.body;

    const spotlight = await Spotlight.findOne();

    if (!spotlight) {
      const newSpotlight = await Spotlight.create(updatedData);
      return res.json({ success: true, message: 'Community spotlight created', spotlight: newSpotlight });
    }

    const updatedSpotlight = await Spotlight.findByIdAndUpdate(
      spotlight._id,
      updatedData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Community spotlight updated successfully', spotlight: updatedSpotlight });
  } catch (error) {
    console.error('Update spotlight error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update spotlight' });
  }
});

// POST add a new project to spotlight (Admin only)
router.post('/projects', protect, admin, validate(schemas.spotlightProject), async (req, res) => {
  try {
    const newProject = req.body;

    const spotlight = await Spotlight.findOne();
    if (!spotlight) {
      return res.status(404).json({ success: false, message: 'Spotlight data not found' });
    }

    spotlight.projects.push(newProject);
    await spotlight.save();

    res.status(201).json({ success: true, message: 'Project added to spotlight successfully', project: newProject });
  } catch (error) {
    console.error('Add project error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add project' });
  }
});

// PUT update a project in spotlight (Admin only)
router.put('/projects/:id', protect, admin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || id.length > 100) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const updatedProject = req.body;

    const spotlight = await Spotlight.findOne();
    if (!spotlight) {
      return res.status(404).json({ success: false, message: 'Spotlight data not found' });
    }

    const projectIndex = spotlight.projects.findIndex(project => project.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    spotlight.projects[projectIndex] = { ...spotlight.projects[projectIndex].toObject(), ...updatedProject };
    await spotlight.save();

    res.json({ success: true, message: 'Project updated successfully', project: spotlight.projects[projectIndex] });
  } catch (error) {
    console.error('Update project error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
});

// DELETE a project from spotlight (Admin only)
router.delete('/projects/:id', protect, admin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || id.length > 100) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const spotlight = await Spotlight.findOne();
    if (!spotlight) {
      return res.status(404).json({ success: false, message: 'Spotlight data not found' });
    }

    const originalLength = spotlight.projects.length;
    spotlight.projects = spotlight.projects.filter(project => project.id !== id);
    
    if (spotlight.projects.length === originalLength) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await spotlight.save();

    res.json({ success: true, message: 'Project removed from spotlight successfully' });
  } catch (error) {
    console.error('Delete project error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

module.exports = router;