import React, { useEffect, useState } from 'react';
import './App.css';

const LANGUAGES = [
  'Javanese',
  'Sundanese',
  'Minang',
  'Bugis',
  'Madurese',
];

function getInitial(name: string) {
  return name && name.length > 0 ? name[0].toUpperCase() : '?';
}

function App() {
  const [activePage, setActivePage] = useState<'feed'|'translate'|'addPhrase'|'leaderboard'>('feed');
  const [threads, setThreads] = useState<any[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState<{open: boolean, threadId: number|null}>({open: false, threadId: null});
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [newPost, setNewPost] = useState({ language: LANGUAGES[0], text: '' });
  const [comment, setComment] = useState({ text: '' });
  const [loading, setLoading] = useState(false);
  const [filterLang, setFilterLang] = useState<string>('');
  const [phrase, setPhrase] = useState({ language: LANGUAGES[0], text: '', translation: '' });
  const [user, setUser] = useState<string|null>(null);
  const [loginName, setLoginName] = useState('');
  const [search, setSearch] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingPhrase, setSubmittingPhrase] = useState(false);
  // Add new thread (from box)
  const [boxPost, setBoxPost] = useState({ language: LANGUAGES[0], text: '' });
  const [submittingBoxPost, setSubmittingBoxPost] = useState(false);

  // Fetch threads
  useEffect(() => {
    if (activePage === 'feed' && user) fetchThreads();
    if (activePage === 'leaderboard' && user) fetchLeaderboard();
  }, [activePage, user]);

  const fetchThreads = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:5000/api/threads');
    const data = await res.json();
    setThreads(data.reverse()); // newest first
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    const res = await fetch('http://localhost:5000/api/leaderboard');
    const data = await res.json();
    setLeaderboard(data);
  };

  // Add new thread
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPost(true);
    await fetch('http://localhost:5000/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPost, user })
    });
    setShowPostModal(false);
    setNewPost({ language: LANGUAGES[0], text: '' });
    setSubmittingPost(false);
    fetchThreads();
    fetchLeaderboard();
  };

  // Add comment/reply
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCommentModal.threadId) return;
    setSubmittingComment(true);
    await fetch(`http://localhost:5000/api/threads/${showCommentModal.threadId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...comment, user })
    });
    setShowCommentModal({open: false, threadId: null});
    setComment({ text: '' });
    setSubmittingComment(false);
    fetchThreads();
  };

  // Add phrase
  const handleAddPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPhrase(true);
    await fetch('http://localhost:5000/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...phrase, user })
    });
    setShowPhraseModal(false);
    setPhrase({ language: LANGUAGES[0], text: '', translation: '' });
    setSubmittingPhrase(false);
    alert('Phrase added!');
    fetchLeaderboard();
  };

  // Upvote/downvote
  const handleVote = async (id: number, type: 'upvote'|'downvote') => {
    await fetch(`http://localhost:5000/api/threads/${id}/${type}`, { method: 'POST' });
    fetchThreads();
    fetchLeaderboard();
  };

  // Add new thread (from box)
  const handleBoxPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBoxPost(true);
    await fetch('http://localhost:5000/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...boxPost, user })
    });
    setBoxPost({ language: LANGUAGES[0], text: '' });
    setSubmittingBoxPost(false);
    fetchThreads();
    fetchLeaderboard();
  };

  // Navigation handlers
  const handleNav = (page: typeof activePage) => setActivePage(page);

  // Filtered threads
  let shownThreads = threads;
  if (filterLang) shownThreads = shownThreads.filter(t => t.language === filterLang);
  if (search.trim()) shownThreads = shownThreads.filter(t => t.text.toLowerCase().includes(search.trim().toLowerCase()));

  // Auth: handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginName.trim()) {
      setUser(loginName.trim());
      setLoginName('');
      setSearch('');
      setFilterLang('');
    }
  };
  const handleLogout = () => {
    setUser(null);
    setNewPost({ language: LANGUAGES[0], text: '' });
    setComment({ text: '' });
    setPhrase({ language: LANGUAGES[0], text: '', translation: '' });
    setSearch('');
    setFilterLang('');
  };

  // Reset input when closing modals
  const closePostModal = () => {
    setShowPostModal(false);
    setNewPost({ language: LANGUAGES[0], text: '' });
  };
  const closeCommentModal = () => {
    setShowCommentModal({open: false, threadId: null});
    setComment({ text: '' });
  };
  const closePhraseModal = () => {
    setShowPhraseModal(false);
    setPhrase({ language: LANGUAGES[0], text: '', translation: '' });
  };

  return (
    <>
      {/* Modal Login */}
      {!user && (
        <div className="modal-bg">
          <form className="modal-content" onSubmit={handleLogin} style={{maxWidth: 340}}>
            <h3>Login to Ngerti.ai</h3>
            <input autoFocus required value={loginName} onChange={e=>setLoginName(e.target.value)} placeholder="Enter your username" />
            <div className="modal-actions">
              <button type="submit">Login</button>
            </div>
          </form>
        </div>
      )}

      {/* Navbar */}
      <div className="navbar">
        <div className="logo">Ngerti.ai</div>
        <div className="nav-buttons">
          <button onClick={() => handleNav('feed')}>Feed</button>
          <button onClick={() => handleNav('translate')}>Translate</button>
          <button onClick={() => setShowPhraseModal(true)}>Add phrase</button>
          <button onClick={() => handleNav('leaderboard')}>Leaderboard</button>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search post..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="nav-right">
          {user && <>
            <button onClick={handleLogout} style={{background:'#f5f7fa',color:'#0073e6'}}>Logout</button>
            <div className="avatar">{getInitial(user)}</div>
          </>}
          {user === 'admin' && (
            <button
              style={{background:'#ff4d4f', color:'#fff', marginLeft: 12}}
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete all posts and leaderboard?')) {
                  await fetch('http://localhost:5000/api/reset', { method: 'POST' });
                  fetchThreads();
                  fetchLeaderboard();
                }
              }}
            >
              Reset All
            </button>
          )}
        </div>
      </div>

      <div className="container">
        {/* Sidebar */}
        <div className="sidebar">
          <ul>
            {LANGUAGES.map((lang) => (
              <li key={lang} className={filterLang === lang ? 'selected' : ''} onClick={() => setFilterLang(filterLang === lang ? '' : lang)}>{lang}</li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="main-feed">
          {activePage === 'feed' && <>
            {/* Create Post Box (like Twitter) */}
            {user && (
              <form className="post-card" style={{marginBottom: 28}} onSubmit={handleBoxPost}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <div className="avatar">{getInitial(user)}</div>
                  <select value={boxPost.language} onChange={e=>setBoxPost({...boxPost,language:e.target.value})} style={{borderRadius:16,padding:'6px 12px',fontWeight:500}}>
                    {LANGUAGES.map(l=>(<option key={l}>{l}</option>))}
                  </select>
                </div>
                <textarea required value={boxPost.text} onChange={e=>setBoxPost({...boxPost,text:e.target.value})} placeholder="What's happening?" style={{width:'100%',minHeight:60,resize:'vertical',marginBottom:10,borderRadius:12,border:'1px solid #eee',padding:10,fontSize:16}} />
                <div style={{display:'flex',justifyContent:'flex-end'}}>
                  <button type="submit" disabled={submittingBoxPost || !boxPost.text.trim()} style={{minWidth:90}}>
                    {submittingBoxPost ? <span className="btn-spinner"></span> : 'Post'}
                  </button>
                </div>
              </form>
            )}
            {loading ? <div>Loading...</div> : shownThreads.map((t) => (
              <div className="post-card" key={t.id}>
                <div className="post-header">
                  <div className="avatar">{getInitial(t.user)}</div>
                  <strong>@{t.user}</strong>
                  <span className="timestamp">[{t.language}]</span>
                </div>
                <div className="post-content">
                  <p>{t.text}</p>
                </div>
                <div className="post-actions">
                  <button className="action-btn" onClick={() => handleVote(t.id, 'upvote')} disabled={!user}>⬆️ Upvote ({t.upvotes || 0})</button>
                  <button className="action-btn" onClick={() => handleVote(t.id, 'downvote')} disabled={!user}>⬇️ Downvote ({t.downvotes || 0})</button>
                  <button className="action-btn" onClick={() => setShowCommentModal({open: true, threadId: t.id})} disabled={!user}>💬 Comment</button>
                </div>
                {/* Replies */}
                {t.replies && t.replies.length > 0 && (
                  <div style={{marginTop: '10px', marginLeft: '20px'}}>
                    <b>Replies:</b>
                    {t.replies.map((r: any, i: number) => (
                      <div key={i} style={{marginTop: '4px', fontSize: '15px'}}>
                        <span style={{color:'#0073e6', fontWeight:'bold'}}>@{r.user}:</span> {r.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>}

          {activePage === 'translate' && (
            <div className="post-card">
              <h2>Translate</h2>
              <p>Fitur translate belum dihubungkan ke backend. (Demo: klik tombol di bawah)</p>
              <button onClick={() => alert('Fitur translate belum diimplementasi!')}>Demo Translate</button>
            </div>
          )}
          {activePage === 'leaderboard' && (
            <div className="post-card">
              <h2>Leaderboard</h2>
              <ol>
                {leaderboard.map((b, i) => (
                  <li key={i}>@{b.user}: {b.points} points</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Post */}
      {/* Modal Add Post dihapus, diganti box di feed */}

      {/* Modal Comment */}
      {showCommentModal.open && user && (
        <div className="modal-bg">
          <form className="modal-content" onSubmit={handleAddComment}>
            <h3>Add Comment</h3>
            <textarea required value={comment.text} onChange={e=>setComment({...comment,text:e.target.value})} placeholder="Your comment" />
            <div className="modal-actions">
              <button type="button" onClick={closeCommentModal} disabled={submittingComment}>Cancel</button>
              <button type="submit" disabled={submittingComment}>Comment {submittingComment && <span className="btn-spinner"></span>}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Add Phrase */}
      {showPhraseModal && user && (
        <div className="modal-bg">
          <form className="modal-content" onSubmit={handleAddPhrase}>
            <h3>Add Phrase</h3>
            <select value={phrase.language} onChange={e=>setPhrase({...phrase,language:e.target.value})}>
              {LANGUAGES.map(l=>(<option key={l}>{l}</option>))}
            </select>
            <input required value={phrase.text} onChange={e=>setPhrase({...phrase,text:e.target.value})} placeholder="Phrase (local language)" />
            <input required value={phrase.translation} onChange={e=>setPhrase({...phrase,translation:e.target.value})} placeholder="Meaning (Indonesian)" />
            <div className="modal-actions">
              <button type="button" onClick={closePhraseModal} disabled={submittingPhrase}>Cancel</button>
              <button type="submit" disabled={submittingPhrase}>Submit {submittingPhrase && <span className="btn-spinner"></span>}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default App;