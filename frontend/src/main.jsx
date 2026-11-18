import React, { useEffect, useState } from 'react';
import {
  createRoot
} from 'react-dom/client';
import {
  BrowserRouter,
  useNavigate,
  useLocation,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  ScanLine,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Upload,
  Play,
  FileText,
  Activity,
  LockKeyhole,
  Plus,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './index.css';
const API = 'http://127.0.0.1:8000/api';
async function api(path, opts = {}) {
  const h = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
  const token = localStorage.getItem('token');
  if (token) {
    h.Authorization = 'Bearer ' + token;
  }
  const r = await fetch(API + path, {
    ...opts,
    headers: h
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw Error(d.detail || 'Request failed');
  }
  return d;
}
/* =========================
   AUTH
========================= */
function Auth({ mode }) {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const d = await api('/auth/' + mode, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      nav('/');
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="min-h-screen grid place-items-center p-6 grid-bg">
      <div className="w-full max-w-md glass rounded-3xl p-8 fade">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-cyan-400/10 text-cyan-300">
            <ShieldCheck />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              APIGuard
            </h1>
            <p className="text-slate-400 text-sm">
              Educational API security dashboard
            </p>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {mode === 'login'
            ? 'Welcome back'
            : 'Create your account'}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Assess APIs you own or run locally.
        </p>
        <form
          onSubmit={submit}
          className="space-y-4"
        >
          {mode === 'register' && (
            <input
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Full name"
              value={form.name}
              onChange={e =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
            />
          )}
          <input
            required
            type="email"
            className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
            placeholder="Email"
            value={form.email}
            onChange={e =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
          />
          <input
            required
            type="password"
            className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
            placeholder="Password (6+ chars)"
            value={form.password}
            onChange={e =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
          />
          {err && (
            <div className="text-red-300 bg-red-400/10 rounded-xl p-3 text-sm">
              {err}
            </div>
          )}
          <button className="w-full py-3 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition">
            {mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-6">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <Link
                className="text-cyan-300"
                to="/register"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link
                className="text-cyan-300"
                to="/login"
              >
                Login
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
/* =========================
   NAVIGATION
========================= */
const navs = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/projects', 'Projects', FolderKanban],
  ['/assessment', 'Assessment', ScanLine],
  ['/inventory', 'API Inventory', Activity],
  ['/findings', 'Findings', AlertTriangle],
  ['/history', 'History', Activity],
  ['/report', 'Report', FileText],
  ['/settings', 'Settings', Settings]
];
function Layout({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  );
  if (!localStorage.getItem('token')) {
    return <Auth mode="login" />;
  }
  return (
    <div className="min-h-screen flex">
      <aside
        className={`${
          open
            ? 'fixed inset-0 z-30'
            : 'hidden'
        } lg:block lg:relative w-64 glass border-r border-slate-800 p-5 print:hidden`}
      >
        <div className="flex items-center gap-3 mb-9">
          <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-300">
            <ShieldCheck size={24} />
          </div>
          <div>
            <b>APIGuard</b>
            <div className="text-[10px] text-cyan-300 uppercase tracking-widest">
              Defensive Security
            </div>
          </div>
          <button
            className="lg:hidden ml-auto"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <div className="space-y-1">
          {navs.map(([p, n, I]) => (
            <Link
              onClick={() => setOpen(false)}
              key={p}
              to={p}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm ${
                (
                  loc.pathname === p ||
                  (p === '/report' && loc.pathname.startsWith('/report/'))
                )
                  ? 'bg-cyan-400/10 text-cyan-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <I size={18} />
              {n}
            </Link>
          ))}
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <div className="border-t border-slate-800 pt-4">
            <div className="text-sm font-medium">
              {user.name || 'User'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {user.email}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                nav('/login');
              }}
              className="mt-4 flex gap-2 items-center text-sm text-slate-400 hover:text-red-300"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center px-5 lg:px-8 gap-4 print:hidden">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="text-sm text-slate-400">
            Security Operations{' '}
            <ChevronRight
              size={14}
              className="inline"
            />{' '}
            <span className="text-slate-200">
              {
                navs.find(
                  x => x[0] === loc.pathname
                )?.[1] || 'APIGuard'
              }
            </span>
          </div>
          <div className="ml-auto text-xs text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Local assessment mode
          </div>
        </header>
        <div className="p-5 lg:p-8 max-w-[1500px] mx-auto fade">
          {children}
        </div>
      </main>
    </div>
  );
}
/* =========================
   UI HELPERS
========================= */
function Card({
  children,
  className = ''
}) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}
function Severity({ s }) {
  const m = {
    CRITICAL: 'bg-red-500/15 text-red-300',
    HIGH: 'bg-orange-500/15 text-orange-300',
    MEDIUM: 'bg-yellow-500/15 text-yellow-300',
    LOW: 'bg-blue-500/15 text-blue-300',
    INFO: 'bg-slate-500/15 text-slate-300'
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
        m[s] || m.INFO
      }`}
    >
      {s}
    </span>
  );
}
function Title({
  title,
  sub,
  action
}) {
  return (
    <div className="flex flex-wrap gap-4 items-end justify-between mb-7">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">
          {title}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {sub}
        </p>
      </div>
      {action}
    </div>
  );
}
function Loading() {
  return (
    <div className="py-20 text-center text-slate-500">
      Loading APIGuard…
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className="h-full grid place-items-center text-slate-500 text-sm">
      {text}
    </div>
  );
}
function Modal({
  title,
  close,
  children
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-5">
      <div className="glass rounded-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold">
            {title}
          </h2>
          <button onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Table({
  headers,
  rows
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
            {headers.map(h => (
              <th
                className="py-3 pr-4"
                key={h}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-slate-800/70 last:border-0"
            >
              {r.map((c, j) => (
                <td
                  className="py-4 pr-4"
                  key={j}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
/* =========================
   DASHBOARD
========================= */
function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    async function load() {
      try {
        const data = await api('/dashboard');
        setD(data);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);
  if (!d) {
    return <Loading />;
  }
  const sev = Object.entries(
    d.severity
  ).map(([name, value]) => ({
    name,
    value
  }));
  return (
    <>
      <Title
        title="Security overview"
        sub="Real-time posture across your local API projects."
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {[
          ['Security Score', d.score + '%', LockKeyhole],
          ['Projects', d.projects, FolderKanban],
          ['Endpoints', d.endpoints, Activity],
          ['Assessments', d.assessments, ScanLine],
          ['Findings', d.findings, AlertTriangle]
        ].map(([n, v, I]) => (
          <Card key={n}>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">
                {n}
              </span>
              <I
                size={18}
                className="text-cyan-300"
              />
            </div>
            <div className="text-3xl font-bold mt-3">
              {v}
            </div>
          </Card>
        ))}
      </div>
      <div className="grid xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <h3 className="font-semibold mb-5">
            Assessment history
          </h3>
          <div className="h-64">
            {d.history.length ? (
              <ResponsiveContainer>
                <AreaChart data={d.history}>
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#64748b"
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0b1720',
                      border: '1px solid #334155'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#67e8f9"
                    fill="#67e8f9"
                    fillOpacity={0.08}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="Run your first assessment to see history." />
            )}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold mb-5">
            Severity distribution
          </h3>
          <div className="h-64">
            {d.findings ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={sev}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {sev.map((_, i) => (
                      <Cell key={i} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0b1720',
                      border: '1px solid #334155'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="space-y-2">
            {sev.map(x => (
              <div
                key={x.name}
                className="flex justify-between text-sm"
              >
                <span>
                  <Severity s={x.name} />
                </span>
                <b>{x.value}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid xl:grid-cols-2 gap-5 mt-5">
        <Card>
          <h3 className="font-semibold mb-4">
            Recent findings
          </h3>
          {d.recent_findings.length ? (
            <div className="space-y-3">
              {d.recent_findings
                .slice(0, 5)
                .map(f => (
                  <Link
                    to="/findings"
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[.03] hover:bg-white/[.06]"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {f.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {f.category} · {f.endpoint}
                      </div>
                    </div>
                    <Severity s={f.severity} />
                  </Link>
                ))}
            </div>
          ) : (
            <Empty text="No findings yet." />
          )}
        </Card>
        <Card>
          <h3 className="font-semibold mb-4">
            Recommendations
          </h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              • Import an OpenAPI 3 specification to improve inventory coverage.
            </li>
            <li>
              • Review authentication requirements for business endpoints.
            </li>
            <li>
              • Keep sensitive-looking fields out of API responses.
            </li>
            <li>
              • Harden response headers and CORS for browser-facing APIs.
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
/* =========================
   PROJECTS
========================= */
function Projects() {
  const [ps, setPs] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: ''
  });
  const nav = useNavigate();
  async function load() {
    const data = await api('/projects');
    setPs(data);
  }
  useEffect(() => {
    load();
  }, []);
  async function create(e) {
    e.preventDefault();
    await api('/projects', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    setShow(false);
    setForm({
      name: '',
      description: ''
    });
    load();
  }
  return (
    <>
      <Title
        title="Projects"
        sub="Organize local APIs and their security assessments."
        action={
          <button
            onClick={() => setShow(true)}
            className="flex gap-2 items-center bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold"
          >
            <Plus size={17} />
            New project
          </button>
        }
      />
      {show && (
        <Modal
          title="Create project"
          close={() => setShow(false)}
        >
          <form
            onSubmit={create}
            className="space-y-4"
          >
            <input
              required
              placeholder="Project name"
              className="field"
              value={form.name}
              onChange={e =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
            />
            <textarea
              placeholder="Description"
              className="field min-h-24"
              value={form.description}
              onChange={e =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
            />
            <button className="btn">
              Create project
            </button>
          </form>
        </Modal>
      )}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {ps.map(p => (
          <Card key={p.id}>
            <div className="flex justify-between">
              <div className="p-3 rounded-xl bg-cyan-400/10 text-cyan-300">
                <FolderKanban />
              </div>
              <span className="text-xs text-slate-500">
                {p.targets} target(s)
              </span>
            </div>
            <h3 className="font-semibold mt-5">
              {p.name}
            </h3>
            <p className="text-sm text-slate-400 mt-2 min-h-10">
              {p.description || 'No description'}
            </p>
            <button
              onClick={() => nav('/projects/' + p.id)}
              className="mt-5 w-full py-2.5 rounded-xl border border-slate-700 hover:border-cyan-400/50 text-sm"
            >
              Open project
            </button>
          </Card>
        ))}
        {!ps.length && (
          <Card className="md:col-span-2 xl:col-span-3">
            <Empty text="Create your first project." />
          </Card>
        )}
      </div>
    </>
  );
}
/* =========================
   PROJECT DETAILS
========================= */
function ProjectDetails() {
  const id = useLocation()
    .pathname
    .split('/')
    .pop();
  const [p, setP] = useState(null);
  const [eps, setEps] = useState([]);
  const [form, setForm] = useState({
    name: 'Local Demo API',
    base_url: 'http://127.0.0.1:8001'
  });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  async function load() {
    const [a, b] = await Promise.all([
      api('/projects/' + id),
      api('/projects/' + id + '/endpoints')
    ]);
    setP(a);
    setEps(b);
  }
  useEffect(() => {
    load();
  }, [id]);
  async function target(e) {
    e.preventDefault();
    await api(`/projects/${id}/targets`, {
      method: 'POST',
      body: JSON.stringify(form)
    });
    setMsg('Target added.');
    load();
  }
  async function upload() {
    if (!file || !p.targets[0]) {
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(
      `${API}/projects/${id}/targets/${p.targets[0].id}/openapi`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Bearer ' +
            localStorage.getItem('token')
        },
        body: fd
      }
    );
    const d = await r.json();
    setMsg(d.message || d.detail);
    load();
  }
  if (!p) {
    return <Loading />;
  }
  return (
    <>
      <Title
        title={p.name}
        sub={
          p.description ||
          'Project details and API inventory.'
        }
      />
      <div className="grid xl:grid-cols-3 gap-5">
        <Card>
          <h3 className="font-semibold mb-4">
            Local target
          </h3>
          {p.targets.length ? (
            <div>
              <div className="text-sm">
                {p.targets[0].name}
              </div>
              <div className="text-xs text-cyan-300 mt-1 break-all">
                {p.targets[0].base_url}
              </div>
            </div>
          ) : (
            <form
              onSubmit={target}
              className="space-y-3"
            >
              <input
                className="field"
                placeholder="Target name"
                value={form.name}
                onChange={e =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
              />
              <input
                className="field"
                placeholder="http://127.0.0.1:8001"
                value={form.base_url}
                onChange={e =>
                  setForm({
                    ...form,
                    base_url: e.target.value
                  })
                }
              />
              <button className="btn">
                Add local target
              </button>
            </form>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold mb-4">
            OpenAPI 3 import
          </h3>
          <input
            type="file"
            accept=".json,application/json"
            onChange={e =>
              setFile(e.target.files[0])
            }
            className="text-sm text-slate-400 w-full"
          />
          <button
            disabled={!file || !p.targets.length}
            onClick={upload}
            className="btn mt-4 disabled:opacity-40"
          >
            <Upload size={16} />
            Import specification
          </button>
          {msg && (
            <p className="text-xs text-emerald-300 mt-3">
              {msg}
            </p>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold mb-4">
            Assessment
          </h3>
          <p className="text-sm text-slate-400">
            Run safe checks against the configured localhost target.
          </p>
          <button
            onClick={() =>
              window.location.href =
                '/assessment?project=' + id
            }
            className="btn mt-4"
          >
            <Play size={16} />
            Open assessment
          </button>
        </Card>
      </div>
      <Card className="mt-5">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">
            API inventory
          </h3>
          <span className="text-sm text-slate-500">
            {eps.length} endpoints
          </span>
        </div>
        <Table
          headers={[
            'Method',
            'Path',
            'Tags',
            'Auth'
          ]}
          rows={eps.map(e => [
            <Severity
              s={
                e.method === 'GET'
                  ? 'INFO'
                  : e.method
              }
            />,
            e.path,
            e.tags || '—',
            e.auth_required
              ? 'Required'
              : 'Not declared'
          ])}
        />
      </Card>
    </>
  );
}
/* =========================
   ASSESSMENT
========================= */
function Assessment() {
  const qs = new URLSearchParams(
    useLocation().search
  );
  const pid = qs.get('project');
  const [ps, setPs] = useState([]);
  const [p, setP] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  useEffect(() => {
    async function load() {
      const projects = await api('/projects');
      setPs(projects);
      if (pid) {
        const project = await api(
          '/projects/' + pid
        );
        setP(project);
      } else if (projects[0]) {
        const project = await api(
          '/projects/' + projects[0].id
        );
        setP(project);
      }
    }
    load();
  }, [pid]);
  async function run() {
    if (!p?.targets[0]) {
      return;
    }
    setRunning(true);
    try {
      const d = await api(
        `/projects/${p.id}/targets/${p.targets[0].id}/assess`,
        {
          method: 'POST'
        }
      );
      setResult(d);
    } finally {
      setRunning(false);
    }
  }
  return (
    <>
      <Title
        title="Security assessment"
        sub="Safe defensive checks against a configured localhost target."
      />
      <Card className="mb-5">
        <label className="text-sm text-slate-400">
          Project
        </label>
        <select
          className="field mt-2"
          value={p?.id || ''}
          onChange={async e => {
            const project = await api(
              '/projects/' + e.target.value
            );
            setP(project);
          }}
        >
          <option value="">
            Select project
          </option>
          {ps.map(x => (
            <option
              key={x.id}
              value={x.id}
            >
              {x.name}
            </option>
          ))}
        </select>
        {p && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/50">
            <div className="text-sm font-semibold">
              {p.targets[0]?.name || 'No target'}
            </div>
            <div className="text-xs text-cyan-300 mt-1">
              {p.targets[0]?.base_url ||
                'Add a localhost target first'}
            </div>
          </div>
        )}
        <button
          onClick={run}
          disabled={!p?.targets.length || running}
          className="btn mt-5 disabled:opacity-40"
        >
          {running ? (
            <RefreshCw
              className="animate-spin"
              size={16}
            />
          ) : (
            <Play size={16} />
          )}
          {running
            ? 'Assessing…'
            : 'Run safe assessment'}
        </button>
      </Card>
      {result && (
        <Card>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-400 text-sm">
                Security score
              </div>
              <div className="text-4xl font-bold text-cyan-300">
                {result.score}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">
                Findings
              </div>
              <div className="text-4xl font-bold">
                {result.finding_count}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">
                Assessment
              </div>
              <div className="text-4xl font-bold">
                #{result.id}
              </div>
            </div>
          </div>
          <Link
            to="/findings"
            className="inline-block mt-6 text-cyan-300 text-sm"
          >
            Review findings →
          </Link>
        </Card>
      )}
    </>
  );
}
/* =========================
   FINDINGS
========================= */
function Findings() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    async function load() {
      try {
        const projects = await api('/projects');
        let all = [];
        for (const project of projects) {
          const findings = await api(
            '/projects/' +
            project.id +
            '/findings'
          );
          all.push(...findings);
        }
        setItems(all);
      } catch (e) {
        console.error(
          'Failed to load findings:',
          e
        );
      }
    }
    load();
  }, []);
async function changeStatus() {
  try {
    const newStatus =
      f.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
    await api(`/findings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus
      })
    });
    setF({
      ...f,
      status: newStatus
    });
  } catch (e) {
    console.error('Failed to update finding status:', e);
  }
}
  return (
    <>
      <Title
        title="Findings"
        sub="Actionable defensive observations from completed assessments."
      />
      <Card>
        <Table
          headers={[
            'Severity',
            'Title',
            'Category',
            'Endpoint'
          ]}
          rows={items.map(f => [
            <Severity s={f.severity} />,
            <Link
              className="text-cyan-300"
              to={'/findings/' + f.id}
            >
              {f.title}
            </Link>,
            f.category,
            f.endpoint
          ])}
        />
        {!items.length && (
          <Empty text="No findings. Run an assessment first." />
        )}
      </Card>
    </>
  );
}
/* =========================
   FINDING DETAIL
========================= */
function FindingDetail() {
  const id = useLocation()
    .pathname
    .split('/')
    .pop();
  const [f, setF] = useState(null);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const data = await api(
          '/findings/' + id
        );
        setF(data);
      } catch (e) {
        console.error(
          'Failed to load finding:',
          e
        );
      }
    }
    load();
  }, [id]);
  async function updateStatus() {
    try {
      setUpdating(true);
      const newStatus =
        f.status === 'RESOLVED'
          ? 'OPEN'
          : 'RESOLVED';
      const updated = await api(
        '/findings/' + id + '/status',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: newStatus
          })
        }
      );
      setF(updated);
    } catch (e) {
      console.error(
        'Failed to update finding status:',
        e
      );
    } finally {
      setUpdating(false);
    }
  }
  if (!f) {
    return <Loading />;
  }
  return (
    <>
      <Title
        title={f.title}
        sub={f.endpoint}
      />
      <div className="flex items-center gap-3 mb-5">
        <Severity s={f.severity} />
        <span className="text-sm text-slate-400">
          {f.category}
        </span>
        <span
          className={
            f.status === 'RESOLVED'
              ? 'px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400'
              : 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400'
          }
        >
          {f.status}
        </span>
        <button
          onClick={updateStatus}
          disabled={updating}
          className="ml-auto px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50"
        >
          {updating
            ? 'Updating...'
            : f.status === 'RESOLVED'
              ? 'Reopen Finding'
              : 'Mark as Resolved'
          }
        </button>
      </div>
      <div className="grid xl:grid-cols-2 gap-5">
        <Card>
          <Section
            n="What was detected"
            t={f.description}
          />
          <Section
            n="Evidence"
            t={f.evidence}
          />
        </Card>
        <Card>
          <Section
            n="Impact"
            t={f.impact}
          />
          <Section
            n="Recommended remediation"
            t={f.remediation}
          />
        </Card>
      </div>
    </>
  );
}
function Section({ n, t }) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">
        {n}
      </h3>
      <p className="text-sm text-slate-400 leading-6 whitespace-pre-wrap">
        {t}
      </p>
    </div>
  );
}
/* =========================
   HISTORY
========================= */
function History() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    async function load() {
      try {
        const projects = await api('/projects');
        let all = [];
        for (const project of projects) {
          const assessments = await api(
            '/projects/' +
            project.id +
            '/assessments'
          );
          all.push(...assessments);
        }
        setItems(all);
      } catch (e) {
        console.error(
          'Failed to load assessment history:',
          e
        );
      }
    }
    load();
  }, []);
  return (
    <>
      <Title
        title="Assessment history"
        sub="Previous security assessment runs."
      />
      <Card>
        <Table
          headers={[
            'ID',
            'Date',
            'Score',
            'Findings'
          ]}
          rows={items.map(a => [
            `#${a.id}`,
            new Date(
              a.created_at
            ).toLocaleString(),
            <b
              className={
                a.score >= 80
                  ? 'text-emerald-300'
                  : a.score >= 60
                    ? 'text-yellow-300'
                    : 'text-red-300'
              }
            >
              {a.score}
            </b>,
            a.findings
          ])}
        />
        {!items.length && (
          <Empty text="No assessment history yet." />
        )}
      </Card>
    </>
  );
}
/* =========================
   API INVENTORY
========================= */
function Inventory() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    async function load() {
      try {
        const projects = await api('/projects');
        let all = [];
        for (const project of projects) {
          const endpoints = await api(
            '/projects/' +
            project.id +
            '/endpoints'
          );
          all.push(
            ...endpoints.map(endpoint => ({
              ...endpoint,
              project: project.name
            }))
          );
        }
        setRows(all);
      } catch (e) {
        console.error(
          'Failed to load inventory:',
          e
        );
      }
    }
    load();
  }, []);
  return (
    <>
      <Title
        title="API Inventory"
        sub="Endpoints imported from your OpenAPI specifications."
      />
      <Card>
        <Table
          headers={[
            'Project',
            'Method',
            'Path',
            'Tags',
            'Auth'
          ]}
          rows={rows.map(e => [
            e.project,
            e.method,
            e.path,
            e.tags || '—',
            e.auth_required
              ? 'Required'
              : 'Not declared'
          ])}
        />
        {!rows.length && (
          <Empty text="No endpoints yet. Import an OpenAPI 3 specification from a project." />
        )}
      </Card>
    </>
  );
}
/* =========================
   SETTINGS
========================= */
function SettingsPage() {
  const u = JSON.parse(
    localStorage.getItem('user') || '{}'
  );
  return (
    <>
      <Title
        title="Settings"
        sub="Local account and application information."
      />
      <Card className="max-w-2xl">
        <div className="space-y-5">
          <div>
            <div className="text-xs text-slate-500">
              NAME
            </div>
            <div className="mt-1">
              {u.name}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">
              EMAIL
            </div>
            <div className="mt-1">
              {u.email}
            </div>
          </div>
          <div className="border-t border-slate-800 pt-5">
            <div className="font-semibold">
              Assessment safety
            </div>
            <p className="text-sm text-slate-400 mt-2">
              This build accepts localhost/127.0.0.1
              targets only and performs safe configuration
              checks. It does not provide exploit payloads
              or attack automation.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
/* =========================
   REPORT
========================= */
function ReportIndex() {
  const nav = useNavigate();
  useEffect(() => {
    async function load() {
      try {
        const projects = await api('/projects');
        if (projects.length) {
          nav('/report/' + projects[0].id, {
            replace: true
          });
        }
      } catch (e) {
        console.error(
          'Failed to load report project:',
          e
        );
      }
    }
    load();
  }, [nav]);
  return <Loading />;
}
function Report() {
  const pid = useLocation()
    .pathname
    .split('/')
    .pop();
  const [r, setR] = useState(null);
  useEffect(() => {
    async function load() {
      try {
        const data = await api(
          '/projects/' + pid + '/report'
        );
        setR(data);
      } catch (e) {
        console.error(
          'Failed to load report:',
          e
        );
      }
    }
    load();
  }, [pid]);
  if (!r) {
    return <Loading />;
  }
  return (
    <div className="print-report max-w-4xl mx-auto print:text-black">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            APIGuard Security Report
          </h1>
          <p className="text-slate-400 mt-1">
            Defensive assessment report
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn print:hidden"
        >
          <FileText size={16} />
          Download PDF
        </button>
      </div>
      <Card className="mt-6">
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <small>
              Project
            </small>
            <div className="font-semibold">
              {r.project}
            </div>
          </div>
          <div>
            <small>
              Target
            </small>
            <div className="font-semibold">
              {r.target}
            </div>
          </div>
          <div>
            <small>
              Score
            </small>
            <div className="text-3xl font-bold text-cyan-300">
              {r.score}
            </div>
          </div>
        </div>
      </Card>
      <Card className="mt-5">
        <h2 className="font-semibold mb-4">
          Findings
        </h2>
        {r.findings.map(f => (
          <div
            className="border-b border-slate-800 py-5 last:border-0"
            key={f.id}
          >
            <div className="flex justify-between gap-3">
              <h3 className="font-semibold">
                {f.title}
              </h3>
              <Severity s={f.severity} />
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {f.description}
            </p>
            <p className="text-sm mt-3">
              <b>Remediation:</b>{' '}
              {f.remediation}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}
/* =========================
   APP ROUTES
========================= */
function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Auth mode="login" />}
      />
      <Route
        path="/register"
        element={<Auth mode="register" />}
      />
      <Route
        path="/report"
        element={
          <Layout>
            <ReportIndex />
          </Layout>
        }
      />
      <Route
        path="/report/:id"
        element={
          <Layout>
            <Report />
          </Layout>
        }
      />
      <Route
        path="/findings/:id"
        element={
          <Layout>
            <FindingDetail />
          </Layout>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <Layout>
            <ProjectDetails />
          </Layout>
        }
      />
      <Route
        path="/assessment"
        element={
          <Layout>
            <Assessment />
          </Layout>
        }
      />
      <Route
        path="/inventory"
        element={
          <Layout>
            <Inventory />
          </Layout>
        }
      />
      <Route
        path="/findings"
        element={
          <Layout>
            <Findings />
          </Layout>
        }
      />
      <Route
        path="/history"
        element={
          <Layout>
            <History />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <SettingsPage />
          </Layout>
        }
      />
      <Route
        path="/projects"
        element={
          <Layout>
            <Projects />
          </Layout>
        }
      />
      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
    </Routes>
  );
}
/* =========================
   EXTRA STYLES
========================= */
const styles = document.createElement('style');
styles.textContent = `
.field{
  width:100%;
  background:rgba(2,6,23,.6);
  border:1px solid #334155;
  border-radius:.75rem;
  padding:.7rem 1rem;
  outline:none
}
.field:focus{
  border-color:#22d3ee
}
.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:.5rem;
  background:#22d3ee;
  color:#061018;
  border-radius:.75rem;
  padding:.65rem 1rem;
  font-weight:700
}
.btn:hover{
  background:#67e8f9
}
small{
  color:#64748b;
  font-size:.7rem;
  text-transform:uppercase;
  letter-spacing:.08em
}
@media print {
  body {
    background:#ffffff !important;
    color:#111827 !important;
  }
  .print-report {
    max-width:none !important;
    margin:0 !important;
  }
  .print-report .glass {
    background:#ffffff !important;
    border:1px solid #e2e8f0 !important;
    box-shadow:none !important;
    color:#111827 !important;
  }
  .print-report .text-slate-400 {
    color:#475569 !important;
  }
  .print-report .text-cyan-300 {
    color:#0891b2 !important;
  }
  .print-report .border-slate-800 {
    border-color:#e2e8f0 !important;
  }
}
`;
document.head.appendChild(styles);
createRoot(
  document.getElementById('root')
).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
