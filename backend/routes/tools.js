const express = require('express');
const Tool = require('../models/Tool');
const nodemailer = require('nodemailer');
const { protect, admin } = require('../middleware/auth');
const { validate, schemas, sanitizeString } = require('../middleware/validate');

const router = express.Router();

// GET all tools
// When returning all tools, we need to reconstruct the category-based object structure
// expected by the frontend (e.g. { category1: [tools], category2: [tools] })
router.get('/', async (req, res) => {
  try {
    const tools = await Tool.find({});

    // Group tools by category
    const toolsByCategory = tools.reduce((acc, tool) => {
      const category = tool.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tool);
      return acc;
    }, {});

    // We also need to include the tooltipExplanations from the original appsData.js
    // Since this is static config, we can import it from the source file or store in DB.
    // Ideally it should be in DB, but for now let's grab it from the file to handle legacy structure
    // or just return the categorized tools if frontend handles missing explanations gracefully.
    // Better: let's include it.
    let responseData = { ...toolsByCategory };

    try {
      const appsData = require('../../src/data/appsData');
      if (appsData.tooltipExplanations) {
        responseData.tooltipExplanations = appsData.tooltipExplanations;
      }
    } catch (e) {
      console.warn("Could not load tooltipExplanations from appsData.js");
    }

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all tools belonging to the authenticated user
// IMPORTANT: This must be ABOVE /:category to avoid being matched as a category param
router.get('/my-tools', protect, async (req, res) => {
  try {
    const tools = await Tool.find({ submitter: req.user.id });
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while fetching my tools' });
  }
});

// GET tools by category
router.get('/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const tools = await Tool.find({ category });
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a new tool (Public Submission)
router.post('/submit', protect, validate(schemas.toolSubmit), async (req, res) => {
  try {
    const { name, link, category, builderHandle, description } = req.body;

    // Generate a slug-like ID from the name (sanitized)
    const toolId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if ID already exists
    const existingTool = await Tool.findOne({ id: toolId });
    if (existingTool) {
      return res.status(400).json({ success: false, message: 'A tool with a similar name already exists.' });
    }

    const newTool = await Tool.create({
      id: toolId,
      name,
      url: link,
      category,
      description,
      builder: {
        name: builderHandle || 'Anonymous',
        handle: builderHandle
      },
      submitter: req.user.id,
      status: 'pending',
      verified: false
    });

    // Send email notification to admin
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Sanitize values for email to prevent injection
        const safeName = sanitizeString(name, { maxLength: 100 });
        const safeCategory = sanitizeString(category, { maxLength: 50 });
        const safeBuilder = sanitizeString(builderHandle || 'Anonymous', { maxLength: 100 });
        const safeLink = sanitizeString(link, { maxLength: 500 });
        const safeDesc = sanitizeString(description || '', { maxLength: 500 });

        await transporter.sendMail({
          from: `"Web3Central" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `New Tool Submission: ${safeName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1e293b, #312e81); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
                <h2 style="color: white; margin: 0;">New Tool Submission</h2>
                <p style="color: #a5b4fc; margin: 8px 0 0;">Pending your review on Web3Central</p>
              </div>
              <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Tool Name</td><td style="padding: 8px 0;">${safeName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Category</td><td style="padding: 8px 0;">${safeCategory}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Builder</td><td style="padding: 8px 0;">${safeBuilder}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">URL</td><td style="padding: 8px 0;"><a href="${safeLink}" style="color: #4f46e5;">${safeLink}</a></td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Description</td><td style="padding: 8px 0;">${safeDesc}</td></tr>
                </table>
                <div style="margin-top: 20px; text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Review in Admin Panel</a>
                </div>
              </div>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error("Failed to send notification email:", emailErr.message);
    }

    res.status(201).json({ success: true, message: 'Tool submitted successfully and is pending review.', tool: newTool });
  } catch (error) {
    console.error('Tool submission error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit tool' });
  }
});

// POST a new tool (Admin creation)
router.post('/:category', protect, admin, validate(schemas.toolCreate), async (req, res) => {
  try {
    const category = req.params.category;
    const toolData = { ...req.body };

    // Ensure category matches param
    toolData.category = category;

    // Auto-generate missing required fields from Admin UI payload
    if (!toolData.id && toolData.name) {
      toolData.id = toolData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (!toolData.builder) {
      toolData.builder = {
        name: 'Web3Central Admin',
        twitter: toolData.twitter || ''
      };
    }

    // Check if ID exists
    const existingTool = await Tool.findOne({ id: toolData.id });
    if (existingTool) {
      return res.status(400).json({ success: false, message: 'Tool ID already exists' });
    }

    const newTool = await Tool.create(toolData);
    res.status(201).json({ success: true, message: 'Tool added successfully', tool: newTool });
  } catch (error) {
    console.error('Tool creation error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create tool' });
  }
});

// PUT review a submitted tool (Admin only)
router.put('/:category/:id/review', protect, admin, validate(schemas.toolReview), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const tool = await Tool.findOne({ id }).populate('submitter', 'name email');
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    if (action === 'accept') {
      tool.status = 'active';
    } else {
      tool.status = 'rejected';
    }

    await tool.save();

    // Send notification email to the submitter if their email is available
    if (tool.submitter && tool.submitter.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const safeName = sanitizeString(tool.name, { maxLength: 100 });
        const safeReason = reason ? sanitizeString(reason, { maxLength: 500 }) : '';
        const subject = action === 'accept' ? `Your tool ${safeName} has been approved!` : `Update on your tool submission: ${safeName}`;

        let htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b, #312e81); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">Tool Submission Status Update</h2>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
              <p>Hi ${sanitizeString(tool.submitter.name, { maxLength: 100 })},</p>
        `;

        if (action === 'accept') {
          htmlBody += `
              <p>Great news! Your submission for <strong>${safeName}</strong> has been reviewed and approved by our moderation team.</p>
              <p>It is now live on the platform under the ${sanitizeString(tool.category, { maxLength: 50 })} category.</p>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View the Hub</a>
              </div>
          `;
        } else {
          htmlBody += `
              <p>Thank you for submitting <strong>${safeName}</strong> to our platform.</p>
              <p>Unfortunately, your submission has been declined at this time. ${safeReason ? `<br><br><strong>Reason:</strong> ${safeReason}` : ''}</p>
              <p>If you have any questions or have updated your protocol, you are welcome to submit again in the future.</p>
          `;
        }

        htmlBody += `
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Web3Central" <${process.env.SMTP_USER}>`,
          to: tool.submitter.email,
          subject: subject,
          html: htmlBody
        });
      } catch (emailErr) {
        console.error("Failed to send review notification email:", emailErr.message);
      }
    }

    res.json({ success: true, message: `Tool ${action}ed successfully`, tool });
  } catch (error) {
    console.error('Tool review error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to review tool' });
  }
});

// PUT (update) a tool (Admin only)
router.put('/:category/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent changing critical fields
    delete updateData._id;

    const updatedTool = await Tool.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    res.json({ success: true, message: 'Tool updated successfully', tool: updatedTool });
  } catch (error) {
    console.error('Tool update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update tool' });
  }
});

// DELETE a tool (Admin only)
router.delete('/:category/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTool = await Tool.findOneAndDelete({ id });

    if (!deletedTool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    res.json({ success: true, message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Tool deletion error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete tool' });
  }
});

module.exports = router;