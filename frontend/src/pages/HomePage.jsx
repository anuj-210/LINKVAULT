import { useEffect, useState } from 'react';
import {
  deleteShare,
  getMe,
  getMyShares,
  loginUser,
  logoutUser,
  registerUser,
  uploadFile,
  uploadText
} from '../api';

export default function HomePage() {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [oneTime, setOneTime] = useState(false);
  const [maxViews, setMaxViews] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [ownerOnly, setOwnerOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('authUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [myShares, setMyShares] = useState([]);
  const [mySharesLoading, setMySharesLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthUser(null);
        return;
      }

      try {
        const data = await getMe();
        setAuthUser(data.user);
        localStorage.setItem('authUser', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setAuthUser(null);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (authUser) {
      loadMyShares();
    } else {
      setMyShares([]);
      setOwnerOnly(false);
    }
  }, [authUser]);

  const loadMyShares = async () => {
    try {
      setMySharesLoading(true);
      const data = await getMyShares();
      setMyShares(data.shares || []);
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.error || 'Failed to load your shares' });
    } finally {
      setMySharesLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const payload =
        authMode === 'register'
          ? { email: authEmail, password: authPassword, name: authName }
          : { email: authEmail, password: authPassword };

      const data = authMode === 'register' ? await registerUser(payload) : await loginUser(payload);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setAuthUser(data.user);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setNotice({ type: 'success', message: authMode === 'register' ? 'Account created and logged in' : 'Logged in successfully' });
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.error || `${authMode === 'register' ? 'Register' : 'Login'} failed` });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // no-op
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setAuthUser(null);
      setNotice({ type: 'success', message: 'Logged out' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const metadata = {};
      if (password) metadata.password = password;
      if (oneTime) metadata.oneTime = true;
      if (maxViews) metadata.maxViews = parseInt(maxViews, 10);
      if (expiresAt) metadata.expiresAt = expiresAt;
      if (ownerOnly && authUser) metadata.ownerOnly = true;

      const data = mode === 'text' ? await uploadText({ text, ...metadata }) : await uploadFile(file, metadata);

      setResult(data);
      setText('');
      setFile(null);
      setPassword('');
      setOneTime(false);
      setMaxViews('');
      setExpiresAt('');
      setOwnerOnly(false);
      setShowOptions(false);
      if (authUser) {
        loadMyShares();
      }
      setNotice({ type: 'success', message: 'Share created successfully' });
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.error || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (shareId) => {
    try {
      const targetShareId = shareId || result?.shareId;
      if (!targetShareId) return;
      await navigator.clipboard.writeText(`${window.location.origin}/share/${targetShareId}`);
      setNotice({ type: 'success', message: 'Link copied to clipboard' });
    } catch {
      setNotice({ type: 'error', message: 'Failed to copy link' });
    }
  };

  const handleDeleteFromResult = async () => {
    if (!result?.shareId) return;

    try {
      setDeleting(true);
      await deleteShare(result.shareId, result.deleteToken || null);
      setNotice({ type: 'success', message: 'Share deleted successfully' });
      setResult(null);
      if (authUser) {
        loadMyShares();
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.error || 'Delete failed' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOwnedShare = async (shareId) => {
    try {
      await deleteShare(shareId);
      await loadMyShares();
      setNotice({ type: 'success', message: 'Share deleted' });
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.error || 'Delete failed' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">LinkVault</h1>
        <p className="text-gray-600 mb-6">Share files and text securely</p>
        {notice && (
          <div
            className={`rounded border p-3 mb-4 text-sm ${
              notice.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{notice.message}</span>
              <button onClick={() => setNotice(null)} className="text-xs underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-5 mb-6">
          {!authUser ? (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 px-4 rounded ${authMode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 px-4 rounded ${authMode === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-3">
                {authMode === 'register' && (
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
                >
                  {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create Account' : 'Login'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{authUser.name || authUser.email}</p>
                <p className="text-sm text-gray-500">{authUser.email}</p>
              </div>
              <button onClick={handleLogout} className="bg-gray-200 py-2 px-4 rounded">
                Logout
              </button>
            </div>
          )}
        </div>

        {!result ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('text')}
                className={`flex-1 py-2 px-4 rounded ${mode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Text
              </button>
              <button
                onClick={() => setMode('file')}
                className={`flex-1 py-2 px-4 rounded ${mode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                File
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {mode === 'text' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Your Text</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full p-3 border rounded min-h-[180px]"
                    placeholder="Enter text to share..."
                    required
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select File</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full p-3 border rounded"
                    required
                  />
                  {file && (
                    <p className="text-sm text-gray-600 mt-2">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="text-blue-600 text-sm mb-4"
              >
                {showOptions ? 'Hide' : 'Show'} options
              </button>

              {showOptions && (
                <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Password (optional)</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Set password..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Expires at (optional)</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full p-2 border rounded"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: 10 minutes</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Max views (optional)</label>
                    <input
                      type="number"
                      value={maxViews}
                      onChange={(e) => setMaxViews(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={oneTime}
                      onChange={(e) => setOneTime(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">One-time view (delete after viewing)</span>
                  </label>

                  {authUser && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ownerOnly}
                        onChange={(e) => setOwnerOnly(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Owner-only access (requires your login)</span>
                    </label>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Generate Link'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Link Generated!</h2>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <p className="text-sm font-mono break-all">
                {window.location.origin}/share/{result.shareId}
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => copyLink()} className="flex-1 bg-blue-600 text-white py-2 rounded">
                Copy Link
              </button>
              <a
                href={`/share/${result.shareId}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-gray-200 text-center py-2 rounded"
              >
                Open Link
              </a>
            </div>

            <button
              onClick={handleDeleteFromResult}
              disabled={deleting}
              className="w-full bg-red-100 text-red-700 py-2 rounded mb-3 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete This Share'}
            </button>

            <button onClick={() => setResult(null)} className="w-full bg-gray-200 py-2 rounded">
              Create Another
            </button>
          </div>
        )}

        {authUser && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Shares</h2>
              <button onClick={loadMyShares} className="text-blue-600 text-sm">
                Refresh
              </button>
            </div>

            {mySharesLoading ? (
              <p>Loading...</p>
            ) : myShares.length === 0 ? (
              <p className="text-gray-500">No shares yet.</p>
            ) : (
              <div className="space-y-3">
                {myShares.map((share) => (
                  <div key={share.shareId} className="border rounded p-3">
                    <p className="text-sm font-mono break-all mb-2">
                      {window.location.origin}/share/{share.shareId}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      {share.type === 'file' ? 'File' : 'Text'} | Views: {share.views}
                      {share.maxViews ? `/${share.maxViews}` : ''} | Expires:{' '}
                      {new Date(share.expiresAt).toLocaleString()}
                      {share.ownerOnly ? ' | Owner-only' : ''}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={`/share/${share.shareId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-gray-200 px-3 py-1 rounded text-sm"
                      >
                        Open
                      </a>
                      <button
                        onClick={() => copyLink(share.shareId)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleDeleteOwnedShare(share.shareId)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
