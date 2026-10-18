const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'replace-this-secret-before-deployment'
const dataDir = path.join(__dirname, 'data')
const usersFile = path.join(dataDir, 'users.json')
const noticesFile = path.join(dataDir, 'notices.json')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]')
if (!fs.existsSync(noticesFile)) fs.writeFileSync(noticesFile, '[]')

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json({ limit: '20kb' }))

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return [] }
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}
function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' })
}
function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ message: 'Please sign in first.' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Your session expired. Please sign in again.' })
  }
}

app.get('/api/health', (req, res) => res.json({ message: 'Digital Notice Board API is running.' }))

app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    if (name.length < 2) return res.status(400).json({ message: 'Name must contain at least 2 characters.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' })

    const users = readJson(usersFile)
    if (users.some(user => user.email === email)) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = { id: crypto.randomUUID(), name, email, passwordHash, createdAt: new Date().toISOString() }
    users.push(user)
    writeJson(usersFile, users)
    const safeUser = { id: user.id, name: user.name, email: user.email }
    return res.status(201).json({ message: 'Account created successfully.', user: safeUser, token: createToken(user) })
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ message: 'Could not create the account.' })
  }
})

app.post('/api/auth/signin', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    const users = readJson(usersFile)
    const user = users.find(item => item.email === email)
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Incorrect email or password.' })
    }
    const safeUser = { id: user.id, name: user.name, email: user.email }
    return res.json({ message: 'Signed in successfully.', user: safeUser, token: createToken(user) })
  } catch (error) {
    console.error('Signin error:', error)
    return res.status(500).json({ message: 'Could not sign in right now.' })
  }
})

app.get('/api/notices', (req, res) => {
  const notices = readJson(noticesFile).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ notices })
})

app.post('/api/notices', authRequired, (req, res) => {
  const title = String(req.body.title || '').trim()
  const category = String(req.body.category || 'General').trim()
  const content = String(req.body.content || '').trim()
  if (!title || !content) return res.status(400).json({ message: 'Enter a title and notice details.' })
  if (title.length > 100 || content.length > 2000) return res.status(400).json({ message: 'Title or details are too long.' })

  const notices = readJson(noticesFile)
  const notice = {
    id: crypto.randomUUID(),
    title,
    category: ['General', 'Academics', 'Events', 'Exams', 'Placement'].includes(category) ? category : 'General',
    content,
    authorId: req.user.id,
    authorName: req.user.name,
    createdAt: new Date().toISOString()
  }
  notices.push(notice)
  writeJson(noticesFile, notices)
  res.status(201).json({ message: 'Notice published.', notice })
})

app.delete('/api/notices/:id', authRequired, (req, res) => {
  const notices = readJson(noticesFile)
  const notice = notices.find(item => item.id === req.params.id)
  if (!notice) return res.status(404).json({ message: 'Notice not found.' })
  if (notice.authorId !== req.user.id) return res.status(403).json({ message: 'You can only delete your own notices.' })
  writeJson(noticesFile, notices.filter(item => item.id !== req.params.id))
  res.json({ message: 'Notice deleted.' })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Unexpected server error.' })
})

app.listen(PORT, () => console.log(`Digital Notice Board API running at http://localhost:${PORT}`))
