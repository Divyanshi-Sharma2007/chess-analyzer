import jwt from 'jsonwebtoken'

export default function auth(req, res, next) {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'Not logged in' })
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id
    next()
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' })
  }
}