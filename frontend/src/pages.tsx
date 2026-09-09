import {
  useEffect,
  useState,
  type DependencyList,
} from 'react';
import 'leaflet/dist/leaflet.css';

import { Link, useParams } from 'react-router-dom';
import { api } from './services/api';
import type { Project, Risk } from './types';

import {
  Kpi,
  PageHead,
  ProjectRow,
  RiskBadge,
  money,
  Empty,
} from './components';

import {
  FolderKanban,
  ShieldAlert,
  Clock3,
  IndianRupee,
  Copy,
  Activity,
  ArrowRight,
  TriangleAlert,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  MapPin,
  CalendarDays,
  ReceiptIndianRupee,
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from 'recharts';

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet';


const colors: Record<string, string> = {
  LOW: '#46a171',
  MEDIUM: '#d5a33b',
  HIGH: '#de7e3c',
  CRITICAL: '#e56458',
};




export function Dashboard() {
  const { d: s } = useLoad(api.stats);

  const ps =
    useLoad(() => api.projects('page_size=6')).d?.items || [];

  if (!s) {
    return <div className="page">Loading command center…</div>;
  }

  return (
    <div className="page">
      <PageHead
        kicker="National command center"
        title="Portfolio risk overview"
        desc="A prioritised view of anomalous patterns across the seeded MPLADS-style portfolio."
      />

      <div className="grid-auto">
        <Kpi
          label="Total projects"
          value={s.total_projects}
          sub="Across 8 states"
          icon={FolderKanban}
        />

        <Kpi
          label="Flagged for review"
          value={s.flagged_projects}
          sub="Model or risk threshold"
          icon={ShieldAlert}
        />

        <Kpi
          label="High / critical"
          value={s.high_critical}
          sub="Priority queue"
          icon={Activity}
        />

        <Kpi
          label="Delayed"
          value={s.delayed_projects}
          sub="Past expected date"
          icon={Clock3}
        />

        <Kpi
          label="High cost overrun"
          value={s.high_cost_overrun}
          sub="≥30% variance"
          icon={IndianRupee}
        />

        <Kpi
          label="Potential similar"
          value={s.similar_works}
          sub="Text + proximity"
          icon={Copy}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-5">
        <section className="panel p-5">
          <h2 className="font-semibold">Risk distribution</h2>

          <div className="chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={s.risk_distribution}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {s.risk_distribution.map((x: any) => (
                    <Cell
                      key={x.name}
                      fill={colors[x.name]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4">
            {s.risk_distribution.map((x: any) => (
              <span
                className="text-xs"
                key={x.name}
              >
                <i
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{
                    background: colors[x.name],
                  }}
                />
                {x.name} {x.value}
              </span>
            ))}
          </div>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="font-semibold">Projects by state</h2>

          <div className="chart mt-3">
            <ResponsiveContainer>
              <BarChart data={s.projects_by_state}>
                <CartesianGrid
                  stroke="#223244"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  stroke="#8293a5"
                  fontSize={11}
                />

                <YAxis stroke="#8293a5" />

                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#5e9fe8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel mt-5 overflow-hidden">
        <div className="p-5 flex justify-between">
          <div>
            <h2 className="font-semibold">
              Highest-priority reviews
            </h2>

            <p className="text-xs muted">
              Ranked by transparent prototype risk score
            </p>
          </div>

          <Link
            to="/risk-explorer"
            className="text-sm text-blue-300"
          >
            Open risk explorer →
          </Link>
        </div>

        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Location</th>
              <th>Type</th>
              <th>Sanctioned</th>
              <th>Progress</th>
              <th>Delay</th>
              <th>Score</th>
              <th>Risk</th>
            </tr>
          </thead>

          <tbody>
            {ps.map((p: Project) => (
              <ProjectRow
                p={p}
                key={p.project_id}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}


export function Projects() {
  const [q, setQ] = useState('');
  const [risk, setRisk] = useState('');

  const { d } = useLoad(
    () =>
      api.projects(
        `page_size=100&search=${encodeURIComponent(
          q
        )}&risk_level=${risk}`
      ),
    [q, risk]
  );

  return (
    <div className="page">
      <PageHead
        kicker="Project explorer"
        title="Search and filter works"
        desc="Inspect financial, physical-progress, schedule, and anomaly indicators."
      />

      <div className="panel p-3 flex gap-3 flex-wrap mb-4">
        <div className="relative flex-1 min-w-64">
          <Search
            className="absolute left-3 top-3 text-slate-500"
            size={17}
          />

          <input
            className="input w-full pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search project, district, or description"
          />
        </div>

        <select
          className="input"
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
        >
          <option value="">All risk levels</option>

          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((x) => (
            <option
              key={x}
              value={x}
            >
              {x}
            </option>
          ))}
        </select>

        <span className="btn flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {d?.total || 0} records
        </span>
      </div>

      {!d ? (
        <div>Loading…</div>
      ) : d.items.length ? (
        <div className="panel overflow-auto">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Location</th>
                <th>Type</th>
                <th>Sanctioned</th>
                <th>Progress</th>
                <th>Delay</th>
                <th>Score</th>
                <th>Risk</th>
              </tr>
            </thead>

            <tbody>
              {d.items.map((p: Project) => (
                <ProjectRow
                  p={p}
                  key={p.project_id}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty />
      )}
    </div>
  );
}


export function RiskExplorer() {
  const ps =
    useLoad(() => api.projects('page_size=100')).d?.items || [];

  return (
    <div className="page">
      <PageHead
        kicker="Investigation priority"
        title="Risk explorer"
        desc="A ranked queue—not a finding of wrongdoing. Open any record to review the evidence."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((x) => (
          <div
            className="panel p-4"
            key={x}
          >
            <RiskBadge v={x as Risk} />

            <div className="text-3xl font-bold mt-3">
              {
                ps.filter(
                  (p: Project) => p.risk_level === x
                ).length
              }
            </div>

            <div className="text-xs muted">
              projects
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {ps.slice(0, 30).map((p: Project, i: number) => (
          <Link
            to={`/project/${p.project_id}`}
            className="panel p-4 grid md:grid-cols-[55px_1fr_110px] gap-4 items-center hover:border-blue-500/50"
            key={p.project_id}
          >
            <div className="text-xl font-mono text-slate-500">
              #{i + 1}
            </div>

            <div>
              <div className="flex gap-2 items-center">
                <b className="text-blue-300">
                  {p.project_id}
                </b>

                <RiskBadge v={p.risk_level} />

                <span className="muted text-xs">
                  {p.state} · {p.district}
                </span>
              </div>

              <div className="mt-2 text-sm">
                <b>{p.flagged_reasons[0]?.type}:</b>{' '}
                <span className="muted">
                  {p.flagged_reasons[0]?.text}
                </span>
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold">
                {p.risk_score}
              </div>

              <div className="label">
                Review priority
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


export function MapView() {
  const ps = useLoad(api.map).d || [];
  const [risk, setRisk] = useState('');

  const shown = risk
    ? ps.filter(
        (p: any) => p.risk_level === risk
      )
    : ps;

  return (
    <div className="page">
      <div className="flex justify-between">
        <PageHead
          kicker="Geospatial intelligence"
          title="Project risk map"
          desc="Explore project clusters with OpenStreetMap tiles."
        />

        <select
          className="input"
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
        >
          <option value="">All risks</option>

          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(
            (x) => (
              <option
                key={x}
                value={x}
              >
                {x}
              </option>
            )
          )}
        </select>
      </div>

      <div className="panel overflow-hidden">
        <MapContainer
          center={[22.5, 79]}
          zoom={5}
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {shown.map((p: any) => (
            <CircleMarker
              key={p.project_id}
              center={[
                p.latitude,
                p.longitude,
              ]}
              radius={
                p.risk_level === 'CRITICAL'
                  ? 9
                  : 6
              }
              pathOptions={{
                color: colors[p.risk_level],
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <b>{p.project_id}</b>
                <br />
                {p.work_type}
                <br />
                Risk: {p.risk_score} ({p.risk_level})
                <br />
                Progress: {p.completion_percentage}%
                <br />
                Overrun: {p.cost_overrun_percent}%
                <br />

                <a
                  href={`/project/${p.project_id}`}
                >
                  Investigate →
                </a>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}


export function Investigation() {
  const { id } = useParams();

  const p = useLoad(
    () => api.project(id!),
    [id]
  ).d;

  if (!p) {
    return (
      <div className="page">
        Loading investigation console…
      </div>
    );
  }

  const rec =
    p.risk_score >= 80
      ? 'Immediate priority review recommended. Validate expenditure records, physical progress, procurement trail, and reasons for schedule deviation.'
      : p.risk_score >= 60
      ? 'Priority review recommended. Confirm latest measurements and expenditure evidence.'
      : 'Routine monitoring with targeted validation of the highlighted indicators.';

  return (
    <div className="page">
      <div className="flex justify-between gap-4 mb-5">
        <div>
          <div className="label text-blue-400">
            Investigation console / {p.project_id}
          </div>

          <h1 className="text-2xl font-bold mt-1">
            {p.work_description}
          </h1>

          <div className="muted text-sm mt-1 flex gap-2">
            <MapPin size={16} />
            {p.state} / {p.district} ·{' '}
            {p.implementing_agency}
          </div>
        </div>

        <RiskBadge v={p.risk_level} />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_3fr] gap-4">
        <section
          className="panel p-6 border-l-4"
          style={{
            borderLeftColor:
              colors[p.risk_level],
          }}
        >
          <div className="label">
            Prototype risk score
          </div>

          <div className="text-6xl font-bold mt-3">
            {p.risk_score}
            <span className="text-xl muted">
              {' '}
              / 100
            </span>
          </div>

          <div className="mt-4">
            <RiskBadge v={p.risk_level} />
          </div>

          <p className="text-xs muted mt-5">
            Prioritisation aid only. Not a government-approved risk standard.
          </p>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric
            t="Cost overrun"
            v={`+${p.cost_overrun_percent}%`}
            icon={IndianRupee}
          />

          <Metric
            t="Physical progress"
            v={`${p.completion_percentage}%`}
            icon={Activity}
          />

          <Metric
            t="Funds utilised"
            v={`${(
              p.expenditure_ratio * 100
            ).toFixed(0)}%`}
            icon={ReceiptIndianRupee}
          />

          <Metric
            t="Schedule delay"
            v={`${p.delay_days} days`}
            icon={Clock3}
          />
        </div>
      </div>

      <section className="panel mt-5 p-5">
        <div className="label">
          Section A
        </div>

        <h2 className="text-lg font-bold mt-1">
          AI findings — evidence behind the flag
        </h2>

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          {p.flagged_reasons.map(
            (f: any, index: number) => (
              <div
                className="border border-slate-700 rounded-lg p-4 flex gap-3"
                key={`${f.type}-${index}`}
              >
                {f.severity === 'ok' ? (
                  <CheckCircle2 className="text-emerald-400" />
                ) : (
                  <TriangleAlert className="text-amber-400" />
                )}

                <div>
                  <b>{f.type}</b>

                  <p className="text-sm muted mt-1">
                    {f.text}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <section className="panel p-5">
          <div className="label">
            Section B
          </div>

          <h2 className="text-lg font-bold">
            Peer comparison
          </h2>

          <table className="mt-3">
            <thead>
              <tr>
                <th>Measure</th>
                <th>Project</th>
                <th>Peer median</th>
                <th>Deviation</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Cost</td>
                <td>{money(p.revised_cost)}</td>
                <td>
                  {money(p.peer_median_cost)}
                </td>
                <td>
                  {(
                    p.peer_cost_deviation * 100
                  ).toFixed(0)}
                  %
                </td>
              </tr>

              <tr>
                <td>Expenditure</td>
                <td>{money(p.expenditure)}</td>
                <td>
                  {money(
                    p.peer_median_expenditure
                  )}
                </td>
                <td>
                  {(
                    (p.expenditure /
                      p.peer_median_expenditure -
                      1) *
                    100
                  ).toFixed(0)}
                  %
                </td>
              </tr>

              <tr>
                <td>Progress</td>
                <td>
                  {p.completion_percentage}%
                </td>
                <td>
                  {p.peer_median_progress}%
                </td>
                <td>
                  {(
                    p.completion_percentage -
                    p.peer_median_progress
                  ).toFixed(0)}
                  pp
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs muted mt-3">
            Peers: same work type, state, and approximate sanctioned-cost band.
          </p>
        </section>

        <section className="panel p-5">
          <div className="label">
            Section C
          </div>

          <h2 className="text-lg font-bold">
            Potentially similar works
          </h2>

          <div className="mt-3 space-y-3">
            {p.similar_projects.map(
              (s: any) => (
                <Link
                  to={`/project/${s.project_id}`}
                  className="block border border-slate-700 rounded-lg p-3 hover:border-blue-500"
                  key={s.project_id}
                >
                  <div className="flex justify-between">
                    <b className="text-blue-300">
                      {s.project_id}
                    </b>

                    <b>
                      {s.similarity}%
                    </b>
                  </div>

                  <div className="text-xs muted mt-1">
                    {s.district} · {s.distance_km} km
                  </div>

                  <p className="text-sm mt-2 line-clamp-2">
                    {s.description}
                  </p>
                </Link>
              )
            )}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-5 mt-5">
        <section className="panel p-5">
          <div className="label">
            Section D
          </div>

          <h2 className="text-lg font-bold">
            Project timeline
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mt-5">
            <Step
              i={CalendarDays}
              t="Sanctioned"
              v={p.sanction_date}
            />

            <Step
              i={CalendarDays}
              t="Expected completion"
              v={p.expected_completion_date}
            />

            <Step
              i={ReceiptIndianRupee}
              t="Payments"
              v={`${p.number_of_payments} tranches`}
            />

            <Step
              i={Activity}
              t="Current status"
              v={p.project_status}
            />
          </div>
        </section>

        <section className="panel p-5 bg-blue-500/5 border-blue-500/30">
          <div className="label text-blue-300">
            Section E · Recommended action
          </div>

          <p className="mt-3 font-semibold">
            {rec}
          </p>

          <p className="text-xs muted mt-4">
            Decision support only—an anomaly is not proof of fraud.
          </p>
        </section>
      </div>
    </div>
  );
}


function Metric({
  t,
  v,
  icon: I,
}: any) {
  return (
    <div className="panel p-4">
      <I
        className="text-blue-400"
        size={18}
      />

      <div className="text-2xl font-bold mt-5">
        {v}
      </div>

      <div className="label mt-1">
        {t}
      </div>
    </div>
  );
}


function Step({
  i: I,
  t,
  v,
}: any) {
  return (
    <div>
      <I
        className="text-blue-400"
        size={18}
      />

      <div className="label mt-3">
        {t}
      </div>

      <b className="text-sm">
        {v}
      </b>
    </div>
  );
}


export function Analytics() {
  const s = useLoad(api.stats).d;

  const ps =
    useLoad(
      () => api.projects('page_size=200')
    ).d?.items || [];

  if (!s) {
    return (
      <div className="page">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead
        kicker="Portfolio analytics"
        title="Pattern and variance analysis"
        desc="Interactive summaries derived from the scored demo portfolio."
      />

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartBox t="Average cost overrun by work type">
          <ResponsiveContainer>
            <BarChart data={s.by_work_type}>
              <CartesianGrid
                stroke="#223244"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                stroke="#8293a5"
                fontSize={10}
              />

              <YAxis stroke="#8293a5" />

              <Tooltip />

              <Bar
                dataKey="avg_overrun"
                fill="#de9255"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox t="Average delays by district">
          <ResponsiveContainer>
            <BarChart
              layout="vertical"
              data={s.delays_by_district}
            >
              <CartesianGrid
                stroke="#223244"
                horizontal={false}
              />

              <XAxis
                type="number"
                stroke="#8293a5"
              />

              <YAxis
                dataKey="name"
                type="category"
                width={90}
                stroke="#8293a5"
                fontSize={10}
              />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#5e9fe8"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox t="Expenditure vs physical progress">
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid stroke="#223244" />

              <XAxis
                dataKey="completion_percentage"
                name="Progress %"
                stroke="#8293a5"
              />

              <YAxis
                dataKey="expenditure_ratio"
                name="Funds ratio"
                stroke="#8293a5"
              />

              <Tooltip />

              <Scatter
                data={ps}
                fill="#e97366"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox t="Work-type anomaly count">
          <ResponsiveContainer>
            <BarChart data={s.by_work_type}>
              <CartesianGrid
                stroke="#223244"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                stroke="#8293a5"
                fontSize={10}
              />

              <YAxis stroke="#8293a5" />

              <Tooltip />

              <Bar
                dataKey="anomalies"
                fill="#bf8eda"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}


function ChartBox({
  t,
  children,
}: any) {
  return (
    <section className="panel p-5">
      <h2 className="font-semibold">
        {t}
      </h2>

      <div className="chart mt-3">
        {children}
      </div>
    </section>
  );
}


export function Alerts() {
  const a = useLoad(api.alerts).d || [];

  return (
    <div className="page">
      <PageHead
        kicker="Review notifications"
        title="Alert feed"
        desc="High-signal events generated from current model and rules."
      />

      <div className="space-y-3">
        {a.map((x: any) => (
          <Link
            to={`/project/${x.project_id}`}
            className="panel p-4 flex gap-4 items-center hover:border-blue-500/50"
            key={x.project_id}
          >
            <RiskBadge v={x.level} />

            <div className="flex-1">
              <b>{x.title}</b>

              <p className="text-sm muted mt-1">
                {x.message}
              </p>
            </div>

            <div className="text-xs muted">
              {x.project_id}
              <br />
              {x.district}
            </div>

            <ArrowRight size={18} />
          </Link>
        ))}
      </div>
    </div>
  );
}


export function About() {
  const steps = [
    'Seeded project data',
    'Cleaning & validation',
    'Feature engineering',
    'Isolation Forest',
    'TF-IDF + proximity',
    'Risk scoring',
    'Evidence explanations',
    'Human review',
  ];

  return (
    <div className="page">
      <PageHead
        kicker="Methodology & safeguards"
        title="How MPLADS INSIGHT works"
        desc="A transparent, reproducible prioritisation pipeline for investigative review."
      />

      <section className="panel p-6">
        <div className="grid md:grid-cols-8 gap-2">
          {steps.map((s, i) => (
            <div
              className="relative p-3 bg-slate-800/60 rounded-lg min-h-24"
              key={s}
            >
              <div className="text-blue-400 font-mono text-xs">
                0{i + 1}
              </div>

              <b className="text-sm block mt-3">
                {s}
              </b>

              {i < 7 && (
                <ArrowRight
                  className="absolute -right-3 top-9 z-10 text-slate-500"
                  size={16}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <section className="panel p-6">
          <h2 className="font-bold">
            What the model does
          </h2>

          <ul className="mt-4 space-y-3 text-sm muted">
            <li>
              • Learns unusual combinations across seven robust project indicators.
            </li>

            <li>
              • Compares projects only within meaningful peer groups.
            </li>

            <li>
              • Finds potentially similar works using language and geographic proximity.
            </li>

            <li>
              • Converts evidence into a configurable 0–100 prioritisation score.
            </li>

            <li>
              • Surfaces plain-language reasons for every flag.
            </li>
          </ul>
        </section>

        <section className="panel p-6 border-amber-500/30 bg-amber-500/5">
          <h2 className="font-bold text-amber-300">
            Human-in-the-loop safeguard
          </h2>

          <p className="text-xl mt-4 leading-relaxed">
            “This prototype identifies anomalous patterns for investigation. An anomaly is not proof of fraud.”
          </p>

          <p className="muted mt-4">
            The system does not replace an auditor. It helps an auditor decide where to look first.
          </p>
        </section>
      </div>
    </div>
  );
}

function useLoad<T>(
  fn: () => Promise<T>,
  deps: DependencyList = []
) {
  const [d, setD] = useState<T | null>(null);
  const [e, setE] = useState('');

  useEffect(() => {
    fn()
      .then(setD)
      .catch((x: Error) => {
        setE(x.message);
      });
  }, deps);

  return { d, e };
}