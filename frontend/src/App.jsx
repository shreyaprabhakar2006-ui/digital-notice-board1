import { useEffect, useState } from 'react'

const API = 'http://localhost:5000/api'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dnb_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('dnb_token') || '')
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [notices, setNotices] = useState([])
  const [noticeForm, setNoticeForm] = useState({ title: '', category: 'General', content: '' })
  const [loading, setLoading] = useState(false)

  async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Something went wrong')
    return data
  }

  async function loadNotices() {
    try {
      const data = await api('/notices')
      setNotices(data.notices || [])
    } catch (err) { setMessage(err.message) }
  }

  useEffect(() => { loadNotices() }, [])

  async function handleAuth(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/signin'
      const payload = mode === 'signup'
        ? form
        : { email: form.email, password: form.password }
      const data = await api(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      localStorage.setItem('dnb_token', data.token)
      localStorage.setItem('dnb_user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      setForm({ name: '', email: '', password: '' })
      setMessage(mode === 'signup' ? 'Account created successfully!' : 'Signed in successfully!')
    } catch (err) {
      setMessage(err.message)
    } finally { setLoading(false) }
  }

  function signOut() {
    localStorage.removeItem('dnb_token')
    localStorage.removeItem('dnb_user')
    setToken('')
    setUser(null)
    setMessage('You have signed out.')
  }

  async function addNotice(e) {
    e.preventDefault()
    setMessage('')
    try {
      await api('/notices', { method: 'POST', body: JSON.stringify(noticeForm) })
      setNoticeForm({ title: '', category: 'General', content: '' })
      setMessage('Notice published!')
      await loadNotices()
    } catch (err) { setMessage(err.message) }
  }

  async function deleteNotice(id) {
    if (!window.confirm('Delete this notice?')) return
    try {
      await api(`/notices/${id}`, { method: 'DELETE' })
      setMessage('Notice deleted.')
      await loadNotices()
    } catch (err) { setMessage(err.message) }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand-mark">📌</div>
        <div><h1>Digital Notice Board</h1><p>Campus updates, all in one place.</p></div>
        {user && <button className="button secondary signout" onClick={signOut}>Sign out</button>}
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">YOUR CAMPUS • YOUR UPDATES</span>
          <h2>Stay informed.<br /><span>Never miss a notice.</span></h2>
          <p>Find college announcements, events, deadlines and important updates in one simple place.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="paper">📣<hr/>📅<hr/>🎓</div><span className="spark">✦</span></div>
      </section>

      {message && <div className="message" role="status">{message}</div>}

      {!user ? (
        <section className="auth-layout">
          <div className="welcome">
            <span className="eyebrow">WELCOME TO THE BOARD</span>
            <h2>{mode === 'signup' ? 'Create your account' : 'Good to see you again'}</h2>
            <p>{mode === 'signup' ? 'Sign up to publish notices and manage your posts.' : 'Sign in to publish notices and manage your posts.'}</p>
            <ul><li>✓ Simple campus announcements</li><li>✓ Notices organised by category</li><li>✓ Access from your browser</li></ul>
          </div>
          <form className="auth-card" onSubmit={handleAuth}>
            <div className="tabs">
              <button type="button" className={mode === 'signin' ? 'tab active' : 'tab'} onClick={() => { setMode('signin'); setMessage('') }}>Sign in</button>
              <button type="button" className={mode === 'signup' ? 'tab active' : 'tab'} onClick={() => { setMode('signup'); setMessage('') }}>Sign up</button>
            </div>
            <h3>{mode === 'signup' ? 'Join the notice board' : 'Welcome back'}</h3>
            {mode === 'signup' && <label>Full name<input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Enter your name" required minLength="2" /></label>}
            <label>Email address<input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@example.com" required /></label>
            <label>Password<input type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="At least 6 characters" required minLength="6" /></label>
            <button className="button primary full" disabled={loading}>{loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
            <p className="small-note">Your password is checked by the backend and is not saved in browser storage.</p>
          </form>
        </section>
      ) : (
        <section className="publisher">
          <div className="section-heading"><div><span className="eyebrow">PUBLISH AN UPDATE</span><h2>Hello, {user.name} 👋</h2><p>Share a useful update with your campus.</p></div><span className="user-pill">● Signed in</span></div>
          <form className="notice-form" onSubmit={addNotice}>
            <label>Notice title<input value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm,title:e.target.value})} placeholder="e.g. Internal assessment timetable" required maxLength="100" /></label>
            <label>Category<select value={noticeForm.category} onChange={e => setNoticeForm({...noticeForm,category:e.target.value})}><option>General</option><option>Academics</option><option>Events</option><option>Exams</option><option>Placement</option></select></label>
            <label className="wide">Notice details<textarea value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm,content:e.target.value})} placeholder="Write the important details here…" rows="4" required maxLength="2000" /></label>
            <button className="button primary" type="submit">＋ Publish notice</button>
          </form>
        </section>
      )}

      <section className="notice-section">
        <div className="section-heading"><div><span className="eyebrow">LATEST UPDATES</span><h2>Campus notices</h2><p>Announcements shared by the community.</p></div><span className="count">{notices.length} {notices.length === 1 ? 'notice' : 'notices'}</span></div>
        {notices.length === 0 ? <div className="empty"><div>🗂️</div><h3>No notices yet</h3><p>Sign in and publish the first campus update.</p></div> :
          <div className="notice-grid">{notices.map(n => <article className="notice-card" key={n.id}>
            <div className="notice-card-top"><span className="category">{n.category}</span><span className="date">{new Date(n.createdAt).toLocaleDateString()}</span></div>
            <h3>{n.title}</h3><p className="notice-content">{n.content}</p>
            <div className="notice-footer"><span>Posted by <b>{n.authorName}</b></span>{user && user.id === n.authorId && <button className="delete" onClick={() => deleteNotice(n.id)}>Delete</button>}</div>
          </article>)}</div>
        }
      </section>
      <footer>Digital Notice Board <span>•</span> Made for a better-connected campus</footer>
    </main>
  )
}
