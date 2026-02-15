import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { checkShare, getShare, loginUser } from '../api';

export default function ViewPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState(null);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    loadShare();
  }, [shareId]);

  const loadShare = async () => {
    try {
      setError(null);
      setLoading(true);
      setNeedsAuth(false);
      setNeedsPassword(false);

      const check = await checkShare(shareId);

      if (!check.exists) {
        setError('Share not found');
        setLoading(false);
        return;
      }

      if (check.requiresAuth) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      if (!check.accessible) {
        setError('Share expired or max views reached');
        setLoading(false);
        return;
      }

      if (check.requiresPassword) {
        setNeedsPassword(true);
        setLoading(false);
        return;
      }

      await fetchShare();
    } catch {
      setError('Failed to load share');
      setLoading(false);
    }
  };

  const fetchShare = async (pwd = null) => {
    try {
      setLoading(true);
      const data = await getShare(shareId, pwd);
      setShare(data);
      setNeedsPassword(false);
      setNeedsAuth(false);
      setNotice(null);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error?.toLowerCase().includes('password')) {
        setNotice({ type: 'error', message: 'Incorrect password' });
      } else if (err.response?.status === 403 && err.response?.data?.error?.toLowerCase().includes('authentication')) {
        setNeedsAuth(true);
      } else {
        setError(err.response?.data?.error || 'Failed to load');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    fetchShare(password);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      const data = await loginUser({ email: authEmail, password: authPassword });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setAuthEmail('');
      setAuthPassword('');
      setNotice({ type: 'success', message: 'Logged in successfully' });
      await loadShare();
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.error || 'Login failed' });
    } finally {
      setAuthLoading(false);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(share.content);
      setNotice({ type: 'success', message: 'Text copied to clipboard' });
    } catch {
      setNotice({ type: 'error', message: 'Failed to copy text' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
          <h2 className="text-xl font-bold mb-3">Owner Login Required</h2>
          {notice && (
            <p className={`text-sm mb-3 ${notice.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {notice.message}
            </p>
          )}
          <p className="text-sm text-gray-600 mb-4">
            This share is restricted to the owner account that created it.
          </p>
          <form onSubmit={handleAuth} className="space-y-3">
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 border rounded"
              required
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border rounded"
              required
            />
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 text-white py-3 rounded disabled:opacity-50"
            >
              {authLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Password Required</h2>
          {notice && (
            <p className={`text-sm mb-3 ${notice.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {notice.message}
            </p>
          )}
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full p-3 border rounded mb-4"
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/')} className="text-blue-600 mb-4">
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          {notice && (
            <div
              className={`rounded border p-3 mb-4 text-sm ${
                notice.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}
            >
              {notice.message}
            </div>
          )}
          {share.oneTime && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm">
              This content will be deleted after viewing or download.
            </div>
          )}

          {share.ownerOnly && (
            <div className="bg-indigo-50 border border-indigo-200 rounded p-3 mb-4 text-sm text-indigo-800">
              Owner-only protected share
            </div>
          )}

          {share.type === 'text' ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Text Content</h2>
                <button onClick={copyText} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                  Copy
                </button>
              </div>
              <div className="bg-gray-50 border rounded p-4">
                <pre className="whitespace-pre-wrap text-sm">{share.content}</pre>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4">File Download</h2>
              <div className="bg-blue-50 border border-blue-200 rounded p-6 text-center">
                <p className="font-medium mb-2">{share.filename}</p>
                <p className="text-sm text-gray-600 mb-4">{(share.filesize / 1024 / 1024).toFixed(2)} MB</p>
                <a
                  href={share.downloadUrl}
                  download={share.filename}
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded"
                >
                  Download File
                </a>
              </div>
            </>
          )}

          <div className="mt-6 text-sm text-gray-500 space-y-1">
            <p>
              Views: {share.views}
              {share.maxViews ? ` / ${share.maxViews}` : ''}
            </p>
            <p>Expires: {new Date(share.expiresAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
