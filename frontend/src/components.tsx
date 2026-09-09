import {
  ArrowRight,
  Bell,
  ChartNoAxesCombined,
  FolderSearch,
  Info,
  Landmark,
  LayoutDashboard,
  Map,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import type { Project, Risk } from './types';

export const money = (n: number) => '₹' + (n / 100000).toFixed(1) + 'L';

export const RiskBadge = ({ v }: { v: Risk }) => (
  <span className={'risk ' + v}>{v}</span>
);

const nav = [
  ['/dashboard', 'Command Center', LayoutDashboard],
  ['/projects', 'Projects', FolderSearch],
  ['/risk-explorer', 'Risk Explorer', ShieldAlert],
  ['/map', 'GIS Map', Map],
  ['/analytics', 'Analytics', ChartNoAxesCombined],
  ['/alerts', 'Alerts', Bell],
  ['/about', 'Methodology', Info],
] as const;

export function Layout() {
  return (
    <div className="shell flex">
      <aside className="sidebar w-64 shrink-0 border-r border-slate-800 bg-[#0b1622] p-4 fixed h-full">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 grid place-items-center bg-blue-500/15 border border-blue-400/30 rounded-lg">
            <Landmark className="text-blue-400" />
          </div>

          <div>
            <b className="tracking-wide">MPLADS INSIGHT</b>
            <div className="label mt-1">Decision intelligence</div>
          </div>
        </div>

        <nav className="mt-7 space-y-1">
          {nav.map(([to, n, I]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex gap-3 items-center px-3 py-2.5 rounded-md text-sm ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <I size={17} />
              {n}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 panel p-3">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            Prototype / Demo Dataset
          </div>
          <p className="text-xs muted mt-2">Reference date: 31 Aug 2026</p>
        </div>
      </aside>

      <main className="md:ml-64 flex-1 min-w-0">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-[1000] bg-[#08111cee] backdrop-blur">
          <div>
            <b>AI-Powered Project Anomaly & Risk Intelligence</b>
            <div className="text-xs muted">
              Find unusual projects before they become difficult to investigate.
            </div>
          </div>

          <span className="text-xs text-emerald-300 flex items-center gap-2">
            <i className="w-2 h-2 rounded-full bg-emerald-400" />
            System operational
          </span>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export const PageHead = ({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc: string;
}) => (
  <div className="mb-6">
    <div className="label text-blue-400">{kicker}</div>
    <h1 className="text-2xl font-bold mt-1">{title}</h1>
    <p className="muted mt-1 text-sm">{desc}</p>
  </div>
);

export const Kpi = ({
  label,
  value,
  sub,
  icon: I,
}: {
  label: string;
  value: any;
  sub: string;
  icon: any;
}) => (
  <div className="panel p-4">
    <div className="flex justify-between">
      <div className="label">{label}</div>
      <I size={17} className="text-blue-400" />
    </div>
    <div className="text-3xl font-bold mt-3">{value}</div>
    <div className="text-xs muted mt-1">{sub}</div>
  </div>
);

export const ProjectRow = ({
  p,
  rank,
}: {
  p: Project;
  rank?: number;
}) => (
  <tr>
    {rank && <td className="font-mono text-slate-500">#{rank}</td>}
    <td>
      <Link
        className="text-blue-300 font-semibold hover:underline"
        to={'/project/' + p.project_id}
      >
        {p.project_id}
      </Link>
    </td>
    <td>
      {p.district}
      <div className="muted text-xs">{p.state}</div>
    </td>
    <td>{p.work_type}</td>
    <td>{money(p.sanctioned_amount)}</td>
    <td>{p.completion_percentage}%</td>
    <td>{p.delay_days}d</td>
    <td className="font-bold">{p.risk_score}</td>
    <td>
      <RiskBadge v={p.risk_level} />
    </td>
  </tr>
);

export const Empty = () => (
  <div className="panel p-12 text-center muted">
    <TriangleAlert className="mx-auto mb-3" />
    No records match these filters.
  </div>
);
