"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Server, Activity, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Mock Data for Demo Mode
const MOCK_DATA = {
    health: {
        health: "degraded",
        issues: ["High CPU usage", "Memory pressure detected"]
    },
    metrics: [
        { metric: "cpu_load_1m", value: 2.5, category: "cpu" },
        { metric: "memory_used_percent", value: 0.88, category: "memory" },
        { metric: "disk_free_percent", value: 0.45, category: "disk" }
    ],
    timestamp: new Date().toISOString(),
    source: "Demo Cluster (Simulated)"
};

export default function ObservabilityPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isDemo, setIsDemo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load data passed from workflow
        const stored = localStorage.getItem("observabilityData");
        if (stored) {
            setData(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    // Toggle Handler
    const handleDemoToggle = (checked: boolean) => {
        setIsDemo(checked);
        if (checked) {
            setData(MOCK_DATA);
        } else {
            // Revert to stored real data
            const stored = localStorage.getItem("observabilityData");
            setData(stored ? JSON.parse(stored) : null);
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading telemetry...</div>;

    if (!data && !isDemo) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="text-muted-foreground">No telemetry data found. Run the workflow first.</div>
                <Button onClick={() => router.push("/automation")}>Go to Workflow</Button>
                <div className="flex items-center gap-2 mt-4">
                    <Switch id="demo-mode-empty" checked={isDemo} onCheckedChange={handleDemoToggle} />
                    <Label htmlFor="demo-mode-empty">Enable Demo Data</Label>
                </div>
            </div>
        );
    }

    // Prepare view variables
    const activeData = data || MOCK_DATA;
    const { health, metrics, source, timestamp } = activeData;

    const healthStatus = health?.health || "unknown"; // healthy, degraded, critical

    const getBadgeVariant = (status: string) => {
        switch (status) {
            case "healthy": return "default"; // we'll style custom green
            case "degraded": return "secondary"; // yellow/orange
            case "critical": return "destructive";
            default: return "outline";
        }
    };

    const getHealthIcon = (status: string) => {
        switch (status) {
            case "healthy": return <CheckCircle2 className="size-6 text-green-500" />;
            case "degraded": return <AlertTriangle className="size-6 text-yellow-500" />;
            case "critical": return <XCircle className="size-6 text-red-500" />;
            default: return <Activity className="size-6 text-muted-foreground" />;
        }
    };

    const getHealthColor = (status: string) => {
        switch (status) {
            case "healthy": return "text-green-500";
            case "degraded": return "text-yellow-500";
            case "critical": return "text-red-500";
            default: return "text-muted-foreground";
        }
    };

    // Extract metrics
    // CPU: cpu_load_1m
    const cpuMetric = metrics?.find((m: any) => m.category === "cpu") || { value: 0 };
    // Memory: memory_used_percent
    const memMetric = metrics?.find((m: any) => m.category === "memory") || { value: 0 };
    // Disk: disk_free_percent -> Convert to Used for bar?
    const diskMetric = metrics?.find((m: any) => m.category === "disk") || { value: 0 };
    const diskUsed = 1 - (diskMetric.value || 0);

    // Formatters
    const fmtPercent = (val: number) => `${Math.round(val * 100)}%`;

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            {/* Top Bar */}
            <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/automation")}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">System Observability</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Server className="size-3" />
                            <span>{source}</span>
                            <span>•</span>
                            <span>Last updated: {new Date(timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-card border rounded-lg px-4 py-2">
                    <Label htmlFor="demo-mode" className="text-sm font-medium">Demo Simulation</Label>
                    <Switch id="demo-mode" checked={isDemo} onCheckedChange={handleDemoToggle} />
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3">

                {/* Health Status Card */}
                <Card className="md:col-span-1 border-l-4" style={{
                    borderLeftColor: healthStatus === 'healthy' ? '#22c55e' : healthStatus === 'degraded' ? '#eab308' : '#ef4444'
                }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="size-5" />
                            Health Agent Analysis
                        </CardTitle>
                        <CardDescription>AI-driven system health evaluation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            {getHealthIcon(healthStatus)}
                            <div>
                                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Status</div>
                                <div className={`text-2xl font-bold capitalize ${getHealthColor(healthStatus)}`}>{healthStatus}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Detected Issues</div>
                            {health?.issues && health.issues.length > 0 ? (
                                <ul className="space-y-2">
                                    {health.issues.map((issue: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-sm bg-destructive/10 text-destructive p-2 rounded-md">
                                            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center gap-2 text-sm bg-green-500/10 text-green-600 dark:text-green-400 p-2 rounded-md">
                                    <CheckCircle2 className="size-4" />
                                    No active issues detected.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Metrics Grid */}
                <div className="md:col-span-2 grid gap-6 sm:grid-cols-3">
                    {/* CPU Card */}
                    <MetricCard
                        title="CPU Load"
                        value={cpuMetric.value.toFixed(2)}
                        unit="1m avg"
                        percent={cpuMetric.value > 1 ? 100 : cpuMetric.value * 100} // Rough scaling 
                        status={cpuMetric.value > 0.8 ? "warning" : "normal"}
                    />

                    {/* Memory Card */}
                    <MetricCard
                        title="Memory Usage"
                        value={fmtPercent(memMetric.value)}
                        unit="used"
                        percent={memMetric.value * 100}
                        status={memMetric.value > 0.85 ? "warning" : "normal"}
                    />

                    {/* Disk Card */}
                    <MetricCard
                        title="Disk Usage"
                        value={fmtPercent(diskUsed)}
                        unit="used"
                        percent={diskUsed * 100}
                        status={diskUsed > 0.85 ? "critical" : "normal"}
                    />
                </div>
            </div>

            {/* Raw Metrics Table (Optional, for transparency) */}
            <div className="max-w-6xl mx-auto mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Raw Telemetry</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-muted-foreground">
                            {metrics?.map((m: any, i: number) => (
                                <div key={i} className="p-2 border rounded bg-muted/50">
                                    <div className="font-bold text-foreground">{m.metric}</div>
                                    <div>{m.value}</div>
                                    <div className="opacity-50">{m.category}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Simple Metric Card Component
function MetricCard({ title, value, unit, percent, status }: { title: string, value: string, unit: string, percent: number, status: string }) {
    let colorClass = "bg-primary";
    if (status === "warning") colorClass = "bg-yellow-500";
    if (status === "critical") colorClass = "bg-red-500";

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mb-1">{value}</div>
                <div className="text-xs text-muted-foreground mb-4">{unit}</div>

                {/* Custom Progress Bar */}
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
