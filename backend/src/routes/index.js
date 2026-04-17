const express = require('express'); 
const router = express.Router(); 
 
const { User } = require('../models'); 
const authController = require('../controllers/authController'); 
const { auth, requireRole } = require('../middleware/auth'); 
 
router.post('/auth/register', authController.register); 
router.post('/auth/login', authController.login); 
router.get('/auth/me', auth, authController.me); 
router.post('/auth/change-password', auth, authController.changePassword); 
 
router.get('/users', auth, requireRole('admin', 'director'), async (req, res) =
  const users = await User.findAll({ attributes: { exclude: ['password'] } }); 
  res.json(users); 
}); 
 
router.get('/health', (req, res) = status: 'ok' })); 
 
module.exports = router; 
