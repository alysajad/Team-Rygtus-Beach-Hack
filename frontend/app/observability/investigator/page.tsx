"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, FileText, Activity, Server, Bug, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Mock Data for Demo Mode
const MOCK_DATA = {
    investigation: {
        status: "success",
        log_path: "app.log",
        summary: {
            total_lines_scanned: 1523,
            error_count: 12,
            critical_count: 2,
            metric_issues_count: 1
        },
        metric_issues: ["High Memory usage (> 85%)"],
        snippets: [
            {
                line_number: 145,
                content: "[ERROR] Database connection timeout\n  at db.connect()\n  Retrying in 5 seconds..."
            },
            {
                line_number: 892,
                content: "[CRITICAL] Out of memory exception\n  System running low on available RAM\n  Consider scaling resources"
            }
        ]
    },
    metrics: [
        { metric: "cpu_load_1m", value: 0.65, category: "cpu" },
        { metric: "memory_used_percent", value: 0.91, category: "memory" },
        { metric: "disk_free_percent", value: 0.35, category: "disk" }
    ],
    timestamp: new Date().toISOString(),
    source: "Demo Server (Simulated)"
};

export default function InvestigatorPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isDemo, setIsDemo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load data passed from workflow
        const stored = localStorage.getItem("investigatorData");
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
            const stored = localStorage.getItem("investigatorData");
            setData(stored ? JSON.parse(stored) : null);
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading investigation...</div>;

    if (!data && !isDemo) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="text-muted-foreground">No investigation data found. Run the workflow first.</div>
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
    const { investigation, metrics, source, timestamp } = activeData;

    const investigationStatus = investigation?.status || "unknown";
    const summary = investigation?.summary;
    const metricIssues = investigation?.metric_issues || [];
    const snippets = investigation?.snippets || [];

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            {/* Top Bar */}
            <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/automation")}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Investigation Report</h1>
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

                {/* Summary Card */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Investigation Summary
                        </CardTitle>
                        <CardDescription>Log analysis and system metrics overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="text-sm text-muted-foreground">Status</div>
                                <div className="text-xl font-bold capitalize mt-1">
                                    {investigationStatus === "success" ? (
                                        <span className="text-green-500">Success</span>
                                    ) : (
                                        <span className="text-red-500">Failed</span>
                                    )}
                                </div>
                            </div>
                            {summary && (
                                <>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="text-sm text-muted-foreground">Lines Scanned</div>
                                        <div className="text-xl font-bold mt-1">{summary.total_lines_scanned.toLocaleString()}</div>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="text-sm text-muted-foreground">Errors Found</div>
                                        <div className="text-xl font-bold mt-1 text-orange-500">{summary.error_count}</div>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="text-sm text-muted-foreground">Critical Issues</div>
                                        <div className="text-xl font-bold mt-1 text-red-500">{summary.critical_count}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Metric Issues */}
                {metricIssues.length > 0 && (
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-5" />
                                Metric Issues
                            </CardTitle>
                            <CardDescription>Issues detected from system metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {metricIssues.map((issue: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-3 rounded-md">
                                        <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* No Issues Message */}
                {metricIssues.length === 0 && summary?.error_count === 0 && summary?.critical_count === 0 && (
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="size-5" />
                                <span className="font-medium">No issues detected. System is running smoothly!</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error Snippets */}
                {snippets.length > 0 && (
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bug className="size-5" />
                                Error Snippets
                            </CardTitle>
                            <CardDescription>Context around detected errors and critical issues</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {snippets.map((snippet: any, i: number) => (
                                    <div key={i} className="border rounded-lg p-4 bg-muted/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline">Line {snippet.line_number}</Badge>
                                        </div>
                                        <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-muted p-3 rounded overflow-x-auto">
                                            {snippet.content}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Key Metrics */}
                {metrics && metrics.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Key Metrics</CardTitle>
                            <CardDescription>Normalized system metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-muted-foreground">
                                {metrics.map((m: any, i: number) => (
                                    <div key={i} className="p-2 border rounded bg-muted/50">
                                        <div className="font-bold text-foreground">{m.metric}</div>
                                        <div>{m.value}</div>
                                        <div className="opacity-50">{m.category}</div>
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
