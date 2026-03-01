const express = require('express');
const Spotlight = require('../models/Spotlight');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// GET community spotlight
router.get('/', async (req, res) => {
  try {
    // Assuming we only have one spotlight document. 
    // If not exists, we should probably create one or return null?
    // The seed script created one.
    const spotlight = await Spotlight.findOne();
    if (!spotlight) {
      return res.status(404).json({ error: 'Spotlight data not found' });
    }
    res.json(spotlight);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update community spotlight (Builder Spotlight generally)
router.put('/', protect, admin, async (req, res) => {
  try {
    const updatedData = req.body;

    // Update the first found document
    // If we want to support multiple spotlights, we'd need an ID.
    // For now, singleton pattern.
    const spotlight = await Spotlight.findOne();

    if (!spotlight) {
      // Create if not exists?
      const newSpotlight = await Spotlight.create(updatedData);
      return res.json({ message: 'Community spotlight created', spotlight: newSpotlight });
    }

    const updatedSpotlight = await Spotlight.findByIdAndUpdate(
      spotlight._id,
      updatedData,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Community spotlight updated successfully', spotlight: updatedSpotlight });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add a new project to spotlight
router.post('/projects', protect, admin, async (req, res) => {
  try {
    const newProject = req.body;

    const spotlight = await Spotlight.findOne();
    if (!spotlight) {
      return res.status(404).json({ error: 'Spotlight data not found' });
    }

    spotlight.projects.push(newProject);
    await spotlight.save();

    res.status(201).json({ message: 'Project added to spotlight successfully', project: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update a project in spotlight
router.put('/projects/:id', protect, admin, async (req, res) => {
  try {
    const id = req.params.id;
    const updatedProject = req.body;

    const spotlight = await Spotlight.findOne();
    if (!spotlight) {
      return res.status(404).json({ error: 'Spotlight data not found' });
    }

    const projectIndex = spotlight.projects.findIndex(project => project.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    spotlight.projects[projectIndex] = { ...spotlight.projects[projectIndex].toObject(), ...updatedProject };
    await spotlight.save();

    res.json({ message: 'Project updated successfully', project: spotlight.projects[projectIndex] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a project from spotlight
router.delete('/projects/:id', protect, admin, async (req, res) => {
  try {
    const id = req.params.id;

    const spotlight = await Spotlight.findOne();
    if (!spotlight) {
      return res.status(404).json({ error: 'Spotlight data not found' });
    }

    spotlight.projects = spotlight.projects.filter(project => project.id !== id);
    await spotlight.save();

    res.json({ message: 'Project removed from spotlight successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;