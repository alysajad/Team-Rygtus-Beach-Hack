"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Server, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

// Mock Data for Demo Mode
const MOCK_DATA = {
    reliability: {
        reliability_score: 0.65,
        status: "at_risk",
        predicted_risks: [
            {
                type: "Memory Exhaustion (OOM)",
                probability: 0.72,
                severity: "critical",
                prediction: "High likelihood of OOM Kill. Application stability at risk immediately."
            },
            {
                type: "CPU Saturation",
                probability: 0.45,
                severity: "high",
                prediction: "Potential service degradation within 10 minutes if load persists."
            }
        ],
        timestamp: Math.floor(Date.now() / 1000)
    },
    metrics: [
        { metric: "cpu_load_1m", value: 0.82, category: "cpu" },
        { metric: "memory_used_percent", value: 0.89, category: "memory" },
        { metric: "disk_free_percent", value: 0.35, category: "disk" }
    ],
    timestamp: new Date().toISOString(),
    source: "Demo Server (Simulated)"
};

export default function ReliabilityPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isDemo, setIsDemo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load data passed from workflow
        const stored = localStorage.getItem("reliabilityData");
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
            const stored = localStorage.getItem("reliabilityData");
            setData(stored ? JSON.parse(stored) : null);
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading reliability analysis...</div>;

    if (!data && !isDemo) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="text-muted-foreground">No reliability data found. Run the workflow first.</div>
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
    const { reliability, metrics, source, timestamp } = activeData;

    const reliabilityScore = reliability?.reliability_score || 0;
    const status = reliability?.status || "unknown";
    const predictedRisks = reliability?.predicted_risks || [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "reliable": return "text-green-500";
            case "at_risk": return "text-yellow-500";
            case "unreliable": return "text-red-500";
            default: return "text-muted-foreground";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "reliable": return <CheckCircle2 className="size-8 text-green-500" />;
            case "at_risk": return <AlertTriangle className="size-8 text-yellow-500" />;
            case "unreliable": return <TrendingDown className="size-8 text-red-500" />;
            default: return <Activity className="size-8 text-muted-foreground" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
            case "high": return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
            case "medium": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
            default: return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            {/* Top Bar */}
            <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/automation")}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reliability Analysis</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Server className="size-3" />
                            <span>{source}</span>
                            <span>•</span>
                            <span>Last updated: {new Date(timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-card border rounded-lg px-4 py-2">
                        <Label htmlFor="demo-mode" className="text-sm font-medium">Demo Simulation</Label>
                        <Switch id="demo-mode" checked={isDemo} onCheckedChange={handleDemoToggle} />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid gap-6">

                {/* Reliability Score Card */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="size-5" />
                            System Reliability Score
                        </CardTitle>
                        <CardDescription>Predictive reliability analysis based on current metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            {getStatusIcon(status)}
                            <div className="flex-1">
                                <div className="flex items-baseline gap-3 mb-2">
                                    <div className="text-5xl font-bold">{(reliabilityScore * 100).toFixed(0)}%</div>
                                    <div className={`text-xl font-semibold capitalize ${getStatusColor(status)}`}>
                                        {status.replace('_', ' ')}
                                    </div>
                                </div>
                                <Progress value={reliabilityScore * 100} className="h-3" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Unreliable</span>
                                    <span>At Risk</span>
                                    <span>Reliable</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Predicted Risks */}
                {predictedRisks.length > 0 && (
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="size-5" />
                                Predicted Risks
                            </CardTitle>
                            <CardDescription>Potential issues that may occur based on current system state</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {predictedRisks.map((risk: any, i: number) => (
                                    <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="size-5 shrink-0" />
                                                <h3 className="font-semibold">{risk.type}</h3>
                                            </div>
                                            <Badge variant="outline" className="capitalize">
                                                {risk.severity}
                                            </Badge>
                                        </div>
                                        <div className="mb-3">
                                            <div className="text-sm mb-1">Probability: {(risk.probability * 100).toFixed(0)}%</div>
                                            <Progress value={risk.probability * 100} className="h-2" />
                                        </div>
                                        <p className="text-sm">{risk.prediction}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Risks Message */}
                {predictedRisks.length === 0 && (
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="size-5" />
                                <span className="font-medium">No risks predicted. System is operating within normal parameters!</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Key Metrics */}
                {metrics && metrics.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Current Metrics</CardTitle>
                            <CardDescription>System metrics used for reliability analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {metrics.map((m: any, i: number) => (
                                    <div key={i} className="p-4 border rounded-lg bg-muted/30">
                                        <div className="text-sm text-muted-foreground capitalize mb-1">{m.category}</div>
                                        <div className="text-2xl font-bold mb-1">
                                            {m.metric.includes('percent') ? `${(m.value * 100).toFixed(1)}%` : m.value.toFixed(2)}
                                        </div>
                                        <div className="text-xs font-mono text-muted-foreground">{m.metric}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Raw Prometheus Data */}
                {activeData.rawMetrics && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Raw Prometheus Metrics</CardTitle>
                            <CardDescription>Complete metrics data from the server</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/50 rounded-lg p-4 border max-h-96 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap break-words font-mono text-muted-foreground">
                                    {activeData.rawMetrics}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
