import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts";
import { useDashboard } from "./hooks/useDashboard";
import CountUp from "../../components/CountUp/CountUp";
import "./Dashboard.css";

const DOC_TYPE_LABELS: Record<string, string> = {
    po: "Purchase Order",
    mou: "MOU",
    invoice: "Invoice",
    certificate: "Certificate",
};

const PIE_COLORS: Record<string, string> = {
    Paid: "#2F855A",
    Pending: "#B7791F",
    Processing: "#1A1A2E",
    "On Hold": "#C53030",
};

function formatDocType(type: string): string {
    return DOC_TYPE_LABELS[type] || type;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
}

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" },
    }),
};

function Dashboard() {
    const { data, loading, error } = useDashboard();

    if (loading) return <div className="dashboard"><p>Loading...</p></div>;
    if (error) return <div className="dashboard"><p className="error-text">{error}</p></div>;
    if (!data) return null;

    const barData = Object.entries(data.documentsByType).map(([type, count]) => ({
        name: formatDocType(type),
        count,
    }));

    const pieData = Object.entries(data.paymentStatusCounts).map(([status, count]) => ({
        name: status,
        value: count,
    }));

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">Overview of trainers, documents, and recent activity.</p>

            <div className="stat-cards">
                <motion.div className="card stat-card" custom={0} initial="hidden" animate="visible" variants={cardVariants}>
                    <div className="stat-number"><CountUp value={data.totalTrainers} /></div>
                    <div className="stat-label">Total Trainers</div>
                </motion.div>
                <motion.div className="card stat-card" custom={1} initial="hidden" animate="visible" variants={cardVariants}>
                    <div className="stat-number"><CountUp value={data.totalDocuments} /></div>
                    <div className="stat-label">Documents Generated</div>
                </motion.div>
                <motion.div className="card stat-card" custom={2} initial="hidden" animate="visible" variants={cardVariants}>
                    <div className="stat-number stat-warn"><CountUp value={data.pendingTrainers.length} /></div>
                    <div className="stat-label">Payments Pending</div>
                </motion.div>
            </div>

            <motion.div
                className="card dashboard-panel full-width"
                custom={3}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
            >
                <h2>Documents Generated — Last 14 Days</h2>
                {data.totalDocuments === 0 ? (
                    <p className="empty-text">No documents generated yet.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1A1A2E" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#1A1A2E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                                labelStyle={{ fontWeight: 600 }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#1A1A2E" strokeWidth={2} fill="url(#trendFill)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </motion.div>

            <div className="dashboard-columns">
                <motion.div className="card dashboard-panel" custom={4} initial="hidden" animate="visible" variants={cardVariants}>
                    <h2>Documents by Type</h2>
                    {barData.length === 0 ? (
                        <p className="empty-text">No documents generated yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
                                <Bar dataKey="count" fill="#F2C14E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>

                <motion.div className="card dashboard-panel" custom={5} initial="hidden" animate="visible" variants={cardVariants}>
                    <h2>Trainer Payment Status</h2>
                    {pieData.length === 0 ? (
                        <p className="empty-text">No trainers yet.</p>
                    ) : (
                        <div className="pie-wrapper">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                                        {pieData.map((entry) => (
                                            <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#9CA3AF"} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pie-legend">
                                {pieData.map((entry) => (
                                    <div key={entry.name} className="pie-legend-item">
                                        <span className="pie-swatch" style={{ background: PIE_COLORS[entry.name] || "#9CA3AF" }} />
                                        {entry.name} ({entry.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            <motion.div className="card dashboard-panel full-width" custom={6} initial="hidden" animate="visible" variants={cardVariants}>
                <div className="panel-header-row">
                    <h2>Needs Attention</h2>
                    <Link to="/trainers" className="panel-link">View all trainers →</Link>
                </div>
                {data.pendingTrainers.length === 0 ? (
                    <p className="empty-text">No pending payments — everything's up to date.</p>
                ) : (
                    <ul className="attention-list">
                        {data.pendingTrainers.map((t) => (
                            <li key={t.id} className="attention-item">
                                <span>{t.name}</span>
                                <span className="ref-code">{t.trainer_code}</span>
                                <span className="status-pill warning">Payment Pending</span>
                            </li>
                        ))}
                    </ul>
                )}
            </motion.div>

            <motion.div className="card dashboard-panel full-width" custom={7} initial="hidden" animate="visible" variants={cardVariants}>
                <h2>Recent Documents</h2>
                {data.recentDocuments.length === 0 ? (
                    <p className="empty-text">No documents generated yet.</p>
                ) : (
                    <table className="dashboard-table wide">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Filename</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentDocuments.map((doc) => (
                                <tr key={doc.id}>
                                    <td>{formatDocType(doc.document_type)}</td>
                                    <td className="ref-code">{doc.filename}</td>
                                    <td>{formatDate(doc.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>
        </div>
    );
}

export default Dashboard;