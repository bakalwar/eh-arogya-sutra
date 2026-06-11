const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const { requireDb } = require('../middleware/requireDb');
const { getPostgresModels } = require('../utils/dataSource');
const {
  loadUserProfile,
  bodyToUpdate,
  computeCompletion,
  userRowToProfile
} = require('../services/doctorProfile');

const router = express.Router();

router.use(requireDb);
router.use(requireAuth);

const profileUploadRoot = path.join(__dirname, '../../uploads/profile');

function userUploadDir(userId) {
  const dir = path.join(profileUploadRoot, String(userId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeUploader(fieldPrefix) {
  const storage = multer.diskStorage({
    destination: (req, _file, cb) => cb(null, userUploadDir(req.user.id)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `${fieldPrefix}-${Date.now()}${ext}`);
    }
  });
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = /image\/(jpeg|png|webp|gif)|application\/pdf/.test(file.mimetype);
      cb(ok ? null : new Error('Only images or PDF allowed'), ok);
    }
  });
}

const uploadPhoto = makeUploader('photo');
const uploadLogo = makeUploader('logo');
const uploadSignature = makeUploader('signature');
const uploadSeal = makeUploader('seal');

function publicPath(userId, filename) {
  return `/uploads/profile/${userId}/${filename}`;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await loadUserProfile(req.user.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const { UserPg } = getPostgresModels();
    const user = await UserPg.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const patch = bodyToUpdate(req.body || {});
    const profile = userRowToProfile(user);
    const completion = computeCompletion({ ...profile, ...req.body });
    patch.profile_completed = completion.percent >= 85;

    await user.update(patch);
    await user.reload();

    const updated = userRowToProfile(user);
    const comp = computeCompletion(updated);

    res.json({
      success: true,
      message: 'Profile save ho gaya!',
      data: { profile: updated, completion: comp }
    });
  })
);

function handleUpload(column, pathKey) {
  return asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const webPath = publicPath(req.user.id, req.file.filename);
    const { UserPg } = getPostgresModels();
    const user = await UserPg.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    await user.update({ [column]: webPath });
    res.json({
      success: true,
      message: 'Upload successful',
      data: { path: webPath, [pathKey]: webPath }
    });
  });
}

router.post(
  '/upload-photo',
  uploadPhoto.single('file'),
  handleUpload('profile_photo_path', 'profilePhotoPath')
);
router.post('/upload-logo', uploadLogo.single('file'), handleUpload('clinic_logo_path', 'clinicLogoPath'));
router.post(
  '/upload-signature',
  uploadSignature.single('file'),
  handleUpload('signature_path', 'signaturePath')
);
router.post('/upload-seal', uploadSeal.single('file'), handleUpload('seal_path', 'sealPath'));

module.exports = router;
