"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Activity,
    TrendingUp
} from "lucide-react";

interface AgentResult {
    agentIds: string[];
    agentName: string;
    agentType: string;
    status: "success" | "warning" | "error";
    summary: string;
    details?: any;
    timestamp: string;
}

export default function UnifiedDashboardPage() {
    const router = useRouter();
    const [results, setResults] = useState<AgentResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load data from localStorage
        const storedData = localStorage.getItem("unifiedDashboardData");
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                setResults(parsed);
            } catch (e) {
                console.error("Failed to parse dashboard data", e);
            }
        }
        setLoading(false);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success": return <CheckCircle2 className="size-5 text-green-400" />;
            case "warning": return <AlertTriangle className="size-5 text-yellow-400" />;
            case "error": return <XCircle className="size-5 text-red-400" />;
            default: return <Activity className="size-5 text-zinc-500" />;
        }
    };

    const getAgentIcon = (type: string) => {
        switch (type) {
            case "healthAgent": return <Shield className="size-5 text-green-400" />;
            case "investigatorAgent": return <Shield className="size-5 text-yellow-400" />;
            case "reliabilityAgent": return <TrendingUp className="size-5 text-emerald-400" />;
            default: return <Activity className="size-5 text-blue-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col text-zinc-100">
            {/* Header */}
            <header className="bg-zinc-950 border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/automation")} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                            Agent Execution Dashboard
                        </h1>
                        <p className="text-sm text-zinc-400">
                            Unified view of all active agents
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="size-3" />
                        Last Run: {results.length > 0 ? new Date(results[0].timestamp).toLocaleTimeString() : "--:--"}
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto max-w-4xl p-6 space-y-6">
                {loading ? (
                    <div className="text-center py-20 text-zinc-500">Loading results...</div>
                ) : results.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 rounded-lg border border-dashed border-zinc-800">
                        <h3 className="text-lg font-medium text-white">No Execution Results Found</h3>
                        <p className="text-sm text-zinc-400 mt-2">
                            Run a workflow in the Automation Builder to see results here.
                        </p>
                        <Button className="mt-4 bg-white text-black hover:bg-zinc-200" onClick={() => router.push("/automation")}>
                            Go to Automation Builder
                        </Button>
                    </div>
                ) : (
                    results.map((result, index) => (
                        <Card key={index} className={`shadow-md border-l-4 bg-zinc-900 border-zinc-800 text-zinc-100 ${result.status === "error" ? "border-l-red-500" :
                            result.status === "warning" ? "border-l-yellow-500" :
                                "border-l-green-500"
                            }`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-zinc-800 rounded-lg">
                                            {getAgentIcon(result.agentType)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-white">{result.agentName}</CardTitle>
                                            <div className="text-xs text-zinc-500 font-mono mt-0.5">
                                                IDs: {result.agentIds.join(", ")}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={
                                        result.status === "error" ? "destructive" :
                                            result.status === "warning" ? "outline" :
                                                "default" // default corresponds to primary/black usually, might need custom style for success
                                    } className={
                                        result.status === "success" ? "bg-green-900/30 text-green-400 border-green-800" :
                                            result.status === "warning" ? "bg-yellow-900/30 text-yellow-400 border-yellow-800" : ""
                                    }>
                                        <span className="flex items-center gap-1.5">
                                            {getStatusIcon(result.status)}
                                            {result.status.toUpperCase()}
                                        </span>
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 text-sm text-zinc-300 whitespace-pre-wrap font-mono bg-zinc-950 p-4 rounded-md border border-zinc-800">
                                    {result.summary}
                                </div>
                                {result.details && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800">
                                        <details>
                                            <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 font-medium">
                                                View Raw Details
                                            </summary>
                                            <pre className="mt-2 text-[10px] bg-black border border-zinc-800 text-zinc-300 p-3 rounded overflow-auto max-h-60">
                                                {JSON.stringify(result.details, null, 2)}
                                            </pre>
                                        </details>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </main>
        </div>
    );
}
