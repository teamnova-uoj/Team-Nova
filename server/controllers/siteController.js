const Site = require('../models/Site');
const Device = require('../models/Device');

// @desc    Get all sites
// @route   GET /api/sites
// @access  Private
exports.getSites = async (req, res, next) => {
  try {
    const sites = await Site.find();
    res.status(200).json({ success: true, count: sites.length, data: sites });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single site
// @route   GET /api/sites/:id
// @access  Private
exports.getSite = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
        return res.status(404).json({
            success: false, message: 'Site not found' 
            });
        }
    
    const devices = await Device.find({ site: req.params.id })
      .select('device_id status installation_date lastSeen');
    
    res.status(200).json({ success: true, 
        data: {site, devices }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create site
// @route   POST /api/sites
// @access  Private/Admin
exports.createSite = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const site = await Site.create(req.body);
    res.status(201).json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

// @desc    Update site
// @route   PUT /api/sites/:id
// @access  Private/Admin
exports.updateSite = async (req, res, next) => {
  try {
    // Prevent changing the creator
    delete req.body.createdBy;
    const site = await Site.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true });
    if (!site) 
        return res.status(404).json({ 
            success: false, 
            message: 'Site not found' 
        });
    res.status(200).json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete site
// @route   DELETE /api/sites/:id
// @access  Private/Admin
exports.deleteSite = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ success: false, message: 'Site not found' });
    // Remove all devices associated with this site
    await Device.deleteMany({ site: req.params.id });
    await site.deleteOne();
    res.status(200).json({ success: true, message: 'Site and associated devices removed' });
  } catch (error) {
    next(error);
  }
};
exports.updateThresholds = async (req, res, next) => {
  try {
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { thresholds: req.body },
      { new: true, runValidators: true }
    );
    if (!site) return res.status(404).json({ success: false, message: 'Site not found' });
    res.status(200).json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};
