const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { templateOperations } = require('../utils/dbOperations');

// Get all templates
router.get('/', async (req, res) => {
  try {
    const { category, isPremium } = req.query;
    
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
    
    const templates = await templateOperations.find(filter, { usageCount: -1 });
    
    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const template = await templateOperations.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create template (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const template = await templateOperations.create({
      ...req.body,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update template (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await templateOperations.updateById(req.params.id, req.body);
    const template = await templateOperations.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete template (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const template = await templateOperations.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    await templateOperations.deleteById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: 'Template deleted'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;