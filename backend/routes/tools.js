const express = require('express');
const Tool = require('../models/Tool');
const nodemailer = require('nodemailer');
const { protect, admin } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../errors');

const router = express.Router();

const generateToolId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const sendToolNotificationEmail = async (tool, type, reason = null) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured. Skipping notification.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (type === 'submission') {
    await transporter.sendMail({
      from: `"Web3Central" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `🔧 New Tool Submission: ${tool.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b, #312e81); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">🔧 New Tool Submission</h2>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Tool Name</td><td>${tool.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Category</td><td>${tool.category}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">URL</td><td><a href="${tool.url}">${tool.url}</a></td></tr>
            </table>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${frontendUrl}/admin" style="padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px;">Review in Admin</a>
            </div>
          </div>
        </div>
      `
    });
  }
};

router.get('/', asyncHandler(async (req, res) => {
  const tools = await Tool.find({});

  const toolsByCategory = tools.reduce((acc, tool) => {
    const category = tool.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {});

  let responseData = { ...toolsByCategory };

  try {
    const appsData = require('../../src/data/appsData');
    if (appsData.tooltipExplanations) {
      responseData.tooltipExplanations = appsData.tooltipExplanations;
    }
  } catch (e) {
    // tooltipExplanations not available
  }

  res.json(responseData);
}));

router.get('/my-tools', protect, asyncHandler(async (req, res) => {
  const tools = await Tool.find({ submitter: req.user.id });
  res.json(tools);
}));

router.get('/:category', asyncHandler(async (req, res) => {
  const tools = await Tool.find({ category: req.params.category });
  res.json(tools);
}));

router.post('/submit', protect, asyncHandler(async (req, res) => {
  const { name, link, category, builderHandle, description } = req.body;

  if (!name || !link || !category || !description) {
    throw AppError.validation('Please provide name, link, category, and description');
  }

  const toolId = generateToolId(name);

  const existingTool = await Tool.findOne({ id: toolId });
  if (existingTool) {
    throw AppError.conflict('A tool with a similar name already exists');
  }

  const newTool = await Tool.create({
    id: toolId,
    name,
    url: link,
    category,
    description,
    builder: { name: builderHandle || 'Anonymous', handle: builderHandle },
    submitter: req.user.id,
    status: 'pending',
    verified: false
  });

  try {
    await sendToolNotificationEmail(newTool, 'submission');
  } catch (emailErr) {
    console.error("Failed to send notification email:", emailErr.message);
  }

  res.status(201).json({
    success: true,
    message: 'Tool submitted successfully and is pending review.',
    tool: newTool
  });
}));

router.post('/:category', protect, asyncHandler(async (req, res) => {
  const toolData = { ...req.body, category: req.params.category };

  if (!toolData.name) {
    throw AppError.validation('Tool name is required');
  }

  if (!toolData.id) {
    toolData.id = generateToolId(toolData.name);
  }

  if (!toolData.builder) {
    toolData.builder = { name: 'Web3Central Admin', twitter: toolData.twitter || '' };
  }

  const existingTool = await Tool.findOne({ id: toolData.id });
  if (existingTool) {
    throw AppError.conflict('Tool ID already exists');
  }

  const newTool = await Tool.create(toolData);
  res.status(201).json({ success: true, message: 'Tool added successfully', tool: newTool });
}));

router.put('/:category/:id/review', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  if (!['accept', 'reject'].includes(action)) {
    throw AppError.validation('Invalid action. Use accept or reject.');
  }

  const tool = await Tool.findOne({ id }).populate('submitter', 'name email');
  if (!tool) {
    throw AppError.notFound('Tool');
  }

  tool.status = action === 'accept' ? 'active' : 'rejected';
  await tool.save();

  if (tool.submitter?.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });

      const subject = action === 'accept'
        ? `🎉 Your tool ${tool.name} has been approved!`
        : `Update on your tool submission: ${tool.name}`;

      const content = action === 'accept'
        ? `Your submission for ${tool.name} has been approved and is now live.`
        : `Your submission for ${tool.name} has been declined.${reason ? ` Reason: ${reason}` : ''}`;

      await transporter.sendMail({
        from: `"Web3Central" <${process.env.SMTP_USER}>`,
        to: tool.submitter.email,
        subject,
        text: content
      });
    } catch (emailErr) {
      console.error("Failed to send review notification:", emailErr.message);
    }
  }

  res.json({ success: true, message: `Tool ${action}ed successfully`, tool });
}));

router.put('/:category/:id', protect, asyncHandler(async (req, res) => {
  const updatedTool = await Tool.findOneAndUpdate(
    { id: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedTool) {
    throw AppError.notFound('Tool');
  }

  res.json({ success: true, message: 'Tool updated successfully', tool: updatedTool });
}));

router.delete('/:category/:id', protect, asyncHandler(async (req, res) => {
  const deletedTool = await Tool.findOneAndDelete({ id: req.params.id });

  if (!deletedTool) {
    throw AppError.notFound('Tool');
  }

  res.json({ success: true, message: 'Tool deleted successfully', tool: deletedTool });
}));

module.exports = router;