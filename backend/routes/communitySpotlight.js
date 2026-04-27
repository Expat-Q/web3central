const express = require('express');
const Spotlight = require('../models/Spotlight');
const { protect, admin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const spotlightUpdateSchema = {
    body: {
        builderSpotlight: [{ type: 'object' }]
    }
};

const projectSchema = {
    body: {
        id: ['required', { type: 'string', minLength: 1, maxLength: 50 }],
        name: ['required', { type: 'string', minLength: 2, maxLength: 100 }],
        description: [{ type: 'string', maxLength: 500 }]
    }
};

const projectUpdateSchema = {
    body: {
        name: [{ type: 'string', minLength: 2, maxLength: 100 }],
        description: [{ type: 'string', maxLength: 500 }]
    }
};

// GET community spotlight
router.get('/', async (req, res) => {
  try {
    const spotlights = await Spotlight.find();
    if (!spotlights || spotlights.length === 0) {
      return res.status(404).json({ error: 'Spotlight data not found' });
    }
    res.json(spotlights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update community spotlight (Builder Spotlight generally)
router.put('/', protect, admin, validate(spotlightUpdateSchema), async (req, res) => {
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
router.post('/projects', protect, admin, validate(projectSchema), async (req, res) => {
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
router.put('/projects/:id', protect, admin, validate(projectUpdateSchema), async (req, res) => {
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