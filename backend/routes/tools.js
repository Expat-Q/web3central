const express = require('express');
const Tool = require('../models/Tool');
const nodemailer = require('nodemailer');
const { protect, admin } = require('../middleware/auth');
const { deriveToolLogo } = require('../utils/toolLogo');

const router = express.Router();

const decorateToolWithLogo = (toolDoc) => {
  const tool = toolDoc?.toObject ? toolDoc.toObject() : toolDoc;
  if (!tool.logoUrl) {
    const derived = deriveToolLogo(tool);
    if (derived.logoUrl) {
      tool.logoUrl = derived.logoUrl;
      tool.logoSource = derived.logoSource;
    }
  }
  return tool;
};

// @desc    Manually trigger DeFiLlama metrics sync
// @route   POST /api/tools/sync
// @access  Private/Admin
router.post('/sync', protect, admin, async (req, res) => {
  try {
    const { fetchLlamaData } = require('../services/llamaService');
    const updateCount = await fetchLlamaData();
    res.json({ success: true, message: `Sync completed. Updated ${updateCount} tools.` });
  } catch (err) {
    console.error('Manual sync failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Increment click count for a tool (fire-and-forget analytics)
// @route   POST /api/tools/:id/click
// @access  Public
router.post('/:id/click', async (req, res) => {
  try {
    const tool = await Tool.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { clickCount: 1 } },
      { new: true, select: 'id clickCount' }
    );
    if (!tool) return res.status(404).json({ success: false });
    res.json({ success: true, clickCount: tool.clickCount });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// @desc    Full-text search across tools
// @route   GET /api/tools/search?q=
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q = '' } = req.query;
    if (!q.trim()) return res.json([]);

    const regex = new RegExp(q.trim(), 'i');
    const tools = await Tool.find({
      status: { $ne: 'rejected' },
      $or: [
        { name: regex },
        { description: regex },
        { category: regex },
        { tags: { $elemMatch: { $regex: regex } } }
      ]
    })
      .sort({ weeklyTrendScore: -1, clickCount: -1 })
      .limit(20)
      .lean();

    res.json(tools.map(decorateToolWithLogo));
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// @desc    Get top 5 apps per category (for Home page Top Charts tabs)
// @route   GET /api/tools/top-charts
// @access  Public
router.get('/top-charts', async (req, res) => {
  try {
    const tools = await Tool.find({ status: 'active' })
      .sort({ weeklyTrendScore: -1, clickCount: -1 })
      .lean();

    const grouped = tools.reduce((acc, tool) => {
      const cat = tool.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      if (acc[cat].length < 5) acc[cat].push(decorateToolWithLogo(tool));
      return acc;
    }, {});

    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Get trending tools platform-wide
// @route   GET /api/tools/trending
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const tools = await Tool.find({ status: 'active' })
      .sort({ weeklyTrendScore: -1, clickCount: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, data: tools.map(decorateToolWithLogo) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Developer claims ownership of a tool (pending admin approval)
// @route   POST /api/tools/:id/claim
// @access  Private
router.post('/:id/claim', protect, async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });
    if (!tool) return res.status(404).json({ error: 'App not found' });
    if (tool.developerClaimedBy) return res.status(400).json({ error: 'This app has already been claimed.' });

    tool.developerClaimPending = true;
    await tool.save();

    // Email admin for approval
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({
          from: `"Web3Central" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `🏷️ Developer Claim Request: ${tool.name}`,
          html: `<p>User <strong>${req.user.name}</strong> (${req.user.email}) has requested to claim <strong>${tool.name}</strong>.</p><p>Please review and approve in the Admin panel.</p>`
        });
      }
    } catch (e) { /* silent */ }

    res.json({ success: true, message: 'Claim request submitted. Our team will verify and approve within 24h.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc    Get developer dashboard analytics for authenticated user
// @route   GET /api/tools/developer/dashboard
// @access  Private
router.get('/developer/dashboard', protect, async (req, res) => {
  try {
    const Rating = require('../models/Rating');
    // Tools submitted by OR claimed by this user
    const tools = await Tool.find({
      $or: [
        { submitter: req.user.id },
        { developerClaimedBy: req.user.id }
      ]
    }).lean();

    const toolIds = tools.map(t => t.id);

    // Fetch all ratings for their tools
    const ratings = await Rating.find({ tool: { $in: toolIds } })
      .populate('user', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    // Attach ratings summary to each tool
    const enriched = tools.map(tool => {
      const toolRatings = ratings.filter(r => r.tool === tool.id);
      const avgRating = toolRatings.length
        ? (toolRatings.reduce((s, r) => s + r.score, 0) / toolRatings.length).toFixed(1)
        : null;
      return {
        ...decorateToolWithLogo(tool),
        ratingCount: toolRatings.length,
        averageRating: avgRating ? parseFloat(avgRating) : null,
      };
    });

    res.json({ success: true, tools: enriched, ratings });
  } catch (err) {
    console.error('Developer dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc    Admin approves a developer claim
// @route   PUT /api/tools/:id/claim/approve
// @access  Private/Admin
router.put('/:id/claim/approve', protect, admin, async (req, res) => {
  try {
    const { userId } = req.body;
    const tool = await Tool.findOneAndUpdate(
      { id: req.params.id },
      { developerClaimedBy: userId, developerClaimPending: false },
      { new: true }
    );
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    res.json({ success: true, tool });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all tools
// When returning all tools, we need to reconstruct the category-based object structure
// expected by the frontend (e.g. { category1: [tools], category2: [tools] })
router.get('/', async (req, res) => {
  try {
    const tools = (await Tool.find({})).map(decorateToolWithLogo);

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
    res.json(tools.map(decorateToolWithLogo));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while fetching my tools' });
  }
});

// Category alias map — maps new frontend keys to old DB category values
// If a key maps to an array, we query ALL of those DB categories
const CATEGORY_ALIASES = {
  infofi:          ['infofi'],
  trading:         ['dex', 'perps', 'trading'],
  bridges:         ['interoperability', 'bridges'],
  defi:            ['defi'],
  staking:         ['staking'],
  security:        ['security'],
  analytics:       ['analytics'],
  wallets:         ['wallets'],
  l2:              ['l2'],
  nft:             ['nft'],
  gaming:          ['gaming'],
  privacy:         ['privacy'],
  predictions:     ['predictions'],
  community:       ['communityTools', 'community'],
  'bounty-hub':    ['bountyHub', 'bounty-hub'],
  'rwa':           ['rwa'],
  cex:             ['cex'],
  // Legacy keys still work directly
  dex:             ['dex'],
  perps:           ['perps'],
  interoperability:['interoperability'],
  communityTools:  ['communityTools'],
  bountyHub:       ['bountyHub'],
  onchainAutonomy: ['onchainAutonomy', 'onchain-autonomy'],
  'onchain-autonomy': ['onchainAutonomy', 'onchain-autonomy'],
};

// GET tools by category
router.get('/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const aliases = CATEGORY_ALIASES[category] || [category];
    const tools = await Tool.find({ category: { $in: aliases } });
    res.json(tools.map(decorateToolWithLogo));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const axios = require('axios');

// POST a new tool (Public Submission)
router.post('/submit', protect, async (req, res) => {
  try {
    const { name, link, category, chain, handle, builderHandle, description, auditLink } = req.body;
    const submitHandle = handle || builderHandle || '';

    // Generate a slug-like ID from the name
    const toolId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if ID already exists
    const existingTool = await Tool.findOne({ id: toolId });
    if (existingTool) {
      return res.status(400).json({ error: 'A tool with a similar name already exists.' });
    }

    // Auto-Verification Logic (Tier 1: DefiLlama)
    let verified = false;
    let verificationTier = 4; // Default: Manual
    let metrics = { lastUpdated: new Date() };

    try {
      const llamaRes = await axios.get(`https://api.llama.fi/protocol/${toolId}`, { timeout: 5000 });
      if (llamaRes.data && llamaRes.data.slug) {
        verified = true;
        verificationTier = 1;
        const p = llamaRes.data;
        metrics = {
          tvl: p.tvl?.[p.tvl.length - 1]?.totalTvl || 0,
          chains: p.chains || [chain],
          lastUpdated: new Date()
        };
      }
    } catch (err) {
      // Not found or error: stay unverified (Tier 4)
    }

    const derivedLogo = deriveToolLogo({
      name,
      url: link,
      builder: {
        handle: submitHandle,
        twitter: submitHandle ? `https://x.com/${String(submitHandle).replace(/^@/, '')}` : ''
      }
    });

    const newTool = await Tool.create({
      id: toolId,
      name,
      url: link,
      category,
      description,
      auditLink,
      verificationTier,
      verified,
      builder: {
        name: submitHandle || 'Anonymous',
        handle: submitHandle
      },
      submitter: req.user.id,
      status: 'pending',
      metrics: metrics,
      logoUrl: derivedLogo.logoUrl,
      logoSource: derivedLogo.logoSource
    });

    // Send email notification
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"Web3Central" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `${verified ? '✅ Verified' : '🔧 New'} Submission: ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, ${verified ? '#059669, #10b981' : '#1e293b, #312e81'}); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
                <h2 style="color: white; margin: 0;">${verified ? '✅ Auto-Verified' : '🔧 New Submission'}</h2>
                <p style="color: white; opacity: 0.8; margin: 8px 0 0;">${verified ? 'Protocol matched on DefiLlama' : 'Pending manual review'}</p>
              </div>
              <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Name</td><td style="padding: 8px 0;">${name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Category</td><td style="padding: 8px 0;">${category}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Chain</td><td style="padding: 8px 0;">${chain} ${verified ? ' (Verified)' : ''}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Handle</td><td style="padding: 8px 0;">${submitHandle || 'Anonymous'}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">URL</td><td style="padding: 8px 0;"><a href="${link}" style="color: #4f46e5;">${link}</a></td></tr>
                  ${auditLink ? `<tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Audit</td><td style="padding: 8px 0;"><a href="${auditLink}" style="color: #4f46e5;">Link</a></td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Description</td><td style="padding: 8px 0;">${description}</td></tr>
                </table>
                <div style="margin-top: 20px; text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    ${verified ? 'View in Dashboard' : 'Review in Admin Panel'}
                  </a>
                </div>
              </div>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error("Failed to send notification email:", emailErr.message);
    }

    res.status(201).json({ 
      success: true,
      message: verified ? 'Protocol verified and submitted.' : 'Tool submitted for review.', 
      tool: newTool 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST a new tool (Admin creation)
router.post('/:category', async (req, res) => {
  // Simple admin-key gate (matches Admin page password)
  const adminKey = req.headers['x-admin-key'];
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '213478';
  if (adminKey !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const category = req.params.category;
    const toolData = req.body;

    // Ensure category matches param
    toolData.category = category;

    // Auto-generate missing required fields from Admin UI payload
    if (!toolData.id) {
      toolData.id = toolData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (!toolData.builder) {
      toolData.builder = {
        name: 'Web3Central Admin',
        twitter: toolData.twitter || ''
      };
    }

    const derivedLogo = deriveToolLogo({
      ...toolData,
      category,
      url: toolData.url,
    });

    if (derivedLogo.logoUrl) {
      toolData.logoUrl = derivedLogo.logoUrl;
      toolData.logoSource = derivedLogo.logoSource;
    }

    // Check if ID exists
    const existingTool = await Tool.findOne({ id: toolData.id });
    if (existingTool) {
      return res.status(400).json({ error: 'Tool ID already exists' });
    }

    const newTool = await Tool.create(toolData);
    res.status(201).json({ message: 'Tool added successfully', tool: newTool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT review a submitted tool
router.put('/:category/:id/review', protect, async (req, res) => {
  try {
    const { category, id } = req.params;
    const { action, reason } = req.body; // action: 'accept' or 'reject'

    const tool = await Tool.findOne({ id }).populate('submitter', 'name email');
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    if (action === 'accept') {
      tool.status = 'active';
    } else if (action === 'reject') {
      tool.status = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action. Use accept or reject.' });
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

        const subject = action === 'accept' ? `🎉 Your tool ${tool.name} has been approved!` : `Update on your tool submission: ${tool.name}`;

        let htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b, #312e81); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">Tool Submission Status Update</h2>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
              <p>Hi ${tool.submitter.name},</p>
        `;

        if (action === 'accept') {
          htmlBody += `
              <p>Great news! Your submission for <strong>${tool.name}</strong> has been reviewed and approved by our moderation team.</p>
              <p>It is now live on the platform under the ${tool.category} category.</p>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View the Hub</a>
              </div>
          `;
        } else {
          htmlBody += `
              <p>Thank you for submitting <strong>${tool.name}</strong> to our platform.</p>
              <p>Unfortunately, your submission has been declined at this time. ${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ''}</p>
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
        console.log(`Review notification sent to ${tool.submitter.email}`);
      } catch (emailErr) {
        console.error("Failed to send review notification email:", emailErr.message);
      }
    }

    res.json({ message: `Tool ${action}ed successfully`, tool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT (update) a tool
router.put('/:category/:id', protect, async (req, res) => {
  try {
    const { category, id } = req.params;
    const updateData = req.body;

    const existingTool = await Tool.findOne({ id });
    if (!existingTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const mergedForLogo = {
      ...existingTool.toObject(),
      ...updateData,
      builder: {
        ...(existingTool.builder || {}),
        ...(updateData.builder || {})
      }
    };

    const derivedLogo = deriveToolLogo(mergedForLogo);
    if (derivedLogo.logoUrl) {
      updateData.logoUrl = derivedLogo.logoUrl;
      updateData.logoSource = derivedLogo.logoSource;
    }

    // Prevent changing ID via update if that breaks references, generally safer to ignore ID update
    // But here we rely on ID.

    const updatedTool = await Tool.findOneAndUpdate(
      { id: id }, // Find by custom ID
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Tool updated successfully', tool: updatedTool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a tool
router.delete('/:category/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTool = await Tool.findOneAndDelete({ id });

    if (!deletedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({ message: 'Tool deleted successfully', tool: deletedTool });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;