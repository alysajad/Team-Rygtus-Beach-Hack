"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Activity,
    TrendingUp,
    Bell,
    Search,
    LayoutDashboard,
    Cpu,
    HardDrive,
    Zap,
    FileSearch
} from "lucide-react";
import axios from "axios";

// --- Types ---

interface HealthAgentResult {
    status: string;
    message: string;
    metrics_analyzed: number;
    issues: string[];
}

interface InvestigatorAgentResult {
    status: string;
    message: string;
    errors: any[];
    summary: {
        error_count: number;
        critical_count: number;
    };
    snippets: any[];
}

interface ReliabilityAgentResult {
    risk_score: number;
    reliability_status: string;
    predicted_issues: string[];
}

interface AlertAgentResult {
    alerts: any[];
    total_alerts: number;
    severity_breakdown: any;
    status: string;
}

interface AgentResults {
    health_agent?: HealthAgentResult;
    investigator_agent?: InvestigatorAgentResult;
    reliability_agent?: ReliabilityAgentResult;
    alert_agent?: AlertAgentResult;
}

interface SupervisorAnalysis {
    overview_report: string;
    general_suggestions: string[];
}

interface SupervisorResponse {
    status: string;
    agents_run: string[];
    agent_results: AgentResults;
    supervisor_analysis: SupervisorAnalysis;
    timestamp: number;
}

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
    let color = "bg-zinc-800 text-zinc-400 border-zinc-700";
    let icon = <Activity className="size-3" />;

    const s = status?.toLowerCase() || "";

    if (s.includes("success") || s.includes("healthy") || s.includes("stable")) {
        color = "bg-emerald-950/50 text-emerald-400 border-emerald-900/50";
        icon = <CheckCircle2 className="size-3" />;
    } else if (s.includes("warn") || s.includes("risk")) {
        color = "bg-yellow-950/50 text-yellow-400 border-yellow-900/50";
        icon = <AlertTriangle className="size-3" />;
    } else if (s.includes("error") || s.includes("fail") || s.includes("critical")) {
        color = "bg-red-950/50 text-red-400 border-red-900/50";
        icon = <XCircle className="size-3" />;
    }

    return (
        <Badge variant="outline" className={`gap-1.5 ${color} uppercase tracking-wider text-[10px] font-semibold px-2 py-0.5`}>
            {icon}
            {status}
        </Badge>
    );
};

const MetricCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4 flex items-center justify-between">
        <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-full bg-zinc-950 border border-zinc-800 ${color}`}>
            <Icon className="size-5" />
        </div>
    </div>
);

// --- Main Page Component ---

export default function UnifiedDashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState<SupervisorResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Using localhost directly as per plan - in prod this would be an env var
            const response = await axios.get("http://localhost:8000/agents/supervisor", {
                params: {
                    agents: ["health", "investigator", "reliability", "alert"],
                },
                paramsSerializer: {
                    indexes: null // Serializes arrays as agents=a&agents=b
                }
            });
            setData(response.data);
        } catch (err: any) {
            console.error("Failed to fetch dashboard data:", err);
            setError(err.message || "Failed to connect to backend agent service");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Tab Content Renderers ---

    const renderOverview = () => {
        if (!data) return null;
        const { supervisor_analysis, agent_results } = data;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
            >
                {/* System Summary Hero */}
                <Card className="bg-zinc-950 border-zinc-800 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Activity className="size-5 text-emerald-500" />
                            System Overview
                        </CardTitle>
                        <CardDescription>
                            AI-Synthesized Report from Supervisor Agent
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-lg leading-relaxed text-zinc-300">
                                {supervisor_analysis.overview_report}
                            </p>
                        </div>
                        {supervisor_analysis.general_suggestions.length > 0 && (
                            <div className="mt-6 space-y-2">
                                <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Supervisor Suggestions</h4>
                                <ul className="space-y-2">
                                    {supervisor_analysis.general_suggestions.map((sug, i) => (
                                        <li key={i} className="flex items-start gap-2 text-zinc-300 bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50">
                                            <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-emerald-500" />
                                            {sug}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Agent Summary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Health Card */}
                    <Card
                        className="bg-zinc-950 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer group"
                        onClick={() => setActiveTab("health")}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Shield className="size-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                <StatusBadge status={agent_results.health_agent?.status || "Unknown"} />
                            </div>
                            <CardTitle className="text-lg">Health Agent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-400 line-clamp-3">
                                {agent_results.health_agent?.message || "No data available"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Investigator Card */}
                    <Card
                        className="bg-zinc-950 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer group"
                        onClick={() => setActiveTab("investigator")}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <FileSearch className="size-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                                <StatusBadge status={agent_results.investigator_agent?.status || "Unknown"} />
                            </div>
                            <CardTitle className="text-lg">Investigator</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg">{agent_results.investigator_agent?.summary?.error_count || 0}</span>
                                    <span className="text-[10px] uppercase">Errors</span>
                                </div>
                                <div className="w-px h-8 bg-zinc-800" />
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg">{agent_results.investigator_agent?.summary?.critical_count || 0}</span>
                                    <span className="text-[10px] uppercase">Scientific</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reliability Card */}
                    <Card
                        className="bg-zinc-950 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer group"
                        onClick={() => setActiveTab("reliability")}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <TrendingUp className="size-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                                <StatusBadge status={agent_results.reliability_agent?.reliability_status || "Unknown"} />
                            </div>
                            <CardTitle className="text-lg">Reliability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <p className="text-sm text-zinc-500">Risk Score</p>
                                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500"
                                        style={{ width: `${Math.min(100, (agent_results.reliability_agent?.risk_score || 0) * 10)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-right text-zinc-400 font-mono pt-1">
                                    {agent_results.reliability_agent?.risk_score}/10
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alert Card */}
                    <Card
                        className="bg-zinc-950 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer group"
                        onClick={() => setActiveTab("alert")}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Bell className="size-6 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
                                <StatusBadge status={agent_results.alert_agent?.status || "Unknown"} />
                            </div>
                            <CardTitle className="text-lg">Alert Agent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-400">
                                {agent_results.alert_agent?.total_alerts || 0} Active Alerts
                            </p>
                            <p className="text-xs text-zinc-600 mt-1">
                                Click to view details
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        );
    };

    const renderHealthTab = () => {
        const res = data?.agent_results.health_agent;
        if (!res) return <div className="text-zinc-500">No health data available.</div>;

        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Shield className="size-6 text-blue-400" /> System Health
                        </h2>
                        <p className="text-zinc-400 mt-1">Real-time infrastructure monitoring</p>
                    </div>
                    <StatusBadge status={res.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard label="Metrics Scanned" value={res.metrics_analyzed?.toString() || "0"} icon={Activity} color="text-zinc-100" />
                    <MetricCard label="Active Issues" value={(res.issues || []).length.toString()} icon={AlertTriangle} color={(res.issues || []).length > 0 ? "text-yellow-500" : "text-emerald-500"} />
                    <MetricCard label="Status" value={res.status} icon={Zap} color="text-zinc-100" />
                </div>

                <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Health Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(res.issues || []).length === 0 ? (
                            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-950/20 p-4 rounded-lg border border-emerald-900/20">
                                <CheckCircle2 className="size-5" />
                                No health issues detected. System is running smoothly.
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {(res.issues || []).map((issue, i) => (
                                    <li key={i} className="flex items-center gap-3 text-red-400 bg-red-950/20 p-4 rounded-lg border border-red-900/20">
                                        <XCircle className="size-5 flex-shrink-0" />
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    const renderInvestigatorTab = () => {
        const res = data?.agent_results.investigator_agent;
        if (!res) return <div className="text-zinc-500">No investigator data available.</div>;

        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <FileSearch className="size-6 text-amber-400" /> Log Investigator
                        </h2>
                        <p className="text-zinc-400 mt-1">Deep log analysis and error detection</p>
                    </div>
                    <StatusBadge status={res.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg text-center">
                        <h3 className="text-3xl font-bold text-white mb-1">{res.summary.error_count}</h3>
                        <p className="text-zinc-500 text-sm uppercase tracking-wider">Total Errors</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg text-center">
                        <h3 className="text-3xl font-bold text-red-500 mb-1">{res.summary.critical_count}</h3>
                        <p className="text-red-500/70 text-sm uppercase tracking-wider">Critical Failures</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-100">Analysis Findings</h3>
                    {(res.snippets || []).length === 0 ? (
                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-950/20 p-8 rounded-lg border border-emerald-900/20 justify-center">
                            <CheckCircle2 className="size-6" />
                            <span className="text-lg">Clean logs. No patterns of concern detected.</span>
                        </div>
                    ) : (
                        (res.snippets || []).map((snippet, i) => (
                            <Card key={i} className="bg-zinc-950 border-zinc-800 overflow-hidden">
                                <CardHeader className="bg-zinc-900/50 border-b border-zinc-800 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-zinc-950 text-zinc-400 font-mono">Line {snippet.line_number}</Badge>
                                            <span className="text-sm text-zinc-500 font-mono">{snippet.suspected_cause_location}</span>
                                        </div>
                                        <Badge variant={snippet.error_type === "Critical" ? "destructive" : "secondary"}>
                                            {snippet.error_type}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <pre className="p-4 bg-black text-xs text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap">
                                        {snippet.content}
                                    </pre>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </motion.div>
        );
    };

    const renderReliabilityTab = () => {
        const res = data?.agent_results.reliability_agent;
        if (!res) return <div className="text-zinc-500">No reliability data available.</div>;

        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <TrendingUp className="size-6 text-purple-400" /> Reliability Predictions
                        </h2>
                        <p className="text-zinc-400 mt-1">Risk assessment and stability forecasting</p>
                    </div>
                    <StatusBadge status={res.reliability_status} />
                </div>

                {/* Risk Gauge */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-red-500/5" />
                    <h3 className="text-zinc-400 text-sm uppercase tracking-widest mb-4 z-10">System Risk Analysis</h3>
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-600">
                            {res.risk_score}<span className="text-3xl text-zinc-600">/10</span>
                        </span>
                        <p className="text-zinc-500 mt-2 font-medium">
                            {res.risk_score < 3 ? "Low Risk" : res.risk_score < 7 ? "Moderate Risk" : "High Risk"}
                        </p>
                    </div>
                </div>

                <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Predicted Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(res.predicted_issues || []).length === 0 ? (
                            <div className="text-zinc-500 italic">No future risks predicted within reliable confidence intervals.</div>
                        ) : (
                            <ul className="space-y-2">
                                {(res.predicted_issues || []).map((issue, i) => (
                                    <li key={i} className="flex items-start gap-3 p-3 bg-zinc-900 rounded border border-zinc-800">
                                        <AlertTriangle className="size-4 text-purple-400 mt-0.5" />
                                        <span className="text-zinc-300 text-sm">{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    const renderAlertTab = () => {
        const res = data?.agent_results.alert_agent;
        if (!res) return <div className="text-zinc-500">No alert data available.</div>;

        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Bell className="size-6 text-red-400" /> Active Alerts
                        </h2>
                        <p className="text-zinc-400 mt-1">Real-time anomaly detection notifications</p>
                    </div>
                    <StatusBadge status={res.status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(res.severity_breakdown || {}).map(([sev, count]: [string, any]) => (
                        <div key={sev} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                            <p className="text-xs text-zinc-500 uppercase">{sev}</p>
                            <p className="text-xl font-bold text-white">{count}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    {res.alerts?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-zinc-950 rounded-lg border border-zinc-800 border-dashed">
                            <Bell className="size-8 mb-3 opacity-20" />
                            No active alerts.
                        </div>
                    ) : (
                        res.alerts?.map((alert, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                                <div className={`mt-1 size-2 rounded-full flex-shrink-0 ${alert.severity === "critical" ? "bg-red-500" :
                                    alert.severity === "warning" ? "bg-yellow-500" : "bg-blue-500"
                                    }`} />
                                <div>
                                    <h4 className="font-medium text-zinc-200">{alert.metric || "System Alert"}</h4>
                                    <p className="text-sm text-zinc-400 mt-1">{alert.message}</p>
                                    <div className="mt-2 flex gap-2">
                                        <Badge variant="secondary" className="text-[10px] bg-zinc-900 text-zinc-500">{alert.timestamp}</Badge>
                                        <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500 uppercase">{alert.severity}</Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        );
    }


    return (
        <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-zinc-950 border-b border-zinc-800 px-8 py-4 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-opacity-80">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/automation")}
                            className="text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full"
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Observability Dashboard</h1>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                <span className="flex items-center gap-1"><LayoutDashboard className="size-3" /> Unified View</span>
                                <span>•</span>
                                <span className={loading ? "text-yellow-500" : "text-emerald-500"}>
                                    {loading ? "Syncing..." : "Live"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 gap-2">
                            <Search className="size-3 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search logs or metrics..."
                                className="bg-transparent border-none outline-none text-xs text-zinc-300 w-48 placeholder:text-zinc-600"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            disabled={loading}
                            className="text-xs border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        >
                            <Clock className={`size-3 mr-2 ${loading ? "animate-spin" : ""}`} />
                            {data ? new Date(data.timestamp * 1000).toLocaleTimeString() : "Refresh"}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Tabs Navigation */}
            <div className="border-b border-zinc-800 bg-zinc-950/50 sticky top-[73px] z-10 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-8 flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {["overview", "health", "investigator", "reliability", "alert"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                relative px-4 py-3 text-sm font-medium transition-colors capitalize
                                ${activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
                            `}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-8">
                {error && (
                    <div className="mb-8 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-400">
                        <XCircle className="size-5" />
                        <div>
                            <p className="font-semibold">Connection Error</p>
                            <p className="text-sm opacity-80">{error}</p>
                            <p className="text-xs mt-1 text-red-500/50">Make sure the backend is running on localhost:8000</p>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {loading && !data ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                            <Activity className="size-10 animate-pulse mb-4" />
                            <p>Gathering intelligence...</p>
                        </div>
                    ) : (
                        <div key={activeTab}>
                            {activeTab === "overview" && renderOverview()}
                            {activeTab === "health" && renderHealthTab()}
                            {activeTab === "investigator" && renderInvestigatorTab()}
                            {activeTab === "reliability" && renderReliabilityTab()}
                            {activeTab === "alert" && renderAlertTab()}
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
