import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = Router()

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 din
}
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
const safe = (u) => ({ id: u._id, name: u.name, email: u.email })

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ error: 'This email is already registered.' })

    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hash })

    res.cookie('token', sign(user._id), cookieOpts).status(201).json({ user: safe(user) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: (email || '').toLowerCase() })
    const ok = user && (await bcrypt.compare(password || '', user.password))
    if (!ok) return res.status(401).json({ error: 'Wrong email or password.' })

    res.cookie('token', sign(user._id), cookieOpts).json({ user: safe(user) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOpts).json({ ok: true })
})

// Current user (page refresh par login yaad rakhne ke liye)
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId)
  if (!user) return res.status(401).json({ error: 'User not found' })
  res.json({ user: safe(user) })
})

export default router