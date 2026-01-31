"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Server,
    Activity,
    BarChart3,
    Mail,
    MessageSquare,
    AlertTriangle,
    Database,
    Globe,
    Bug,
    Bell,
    MessageCircle,
    FileText,
    Shield,
    TrendingUp,
} from "lucide-react";

// Custom Node Component
const CustomNode = ({ data, id }: { data: any; id: string }) => {
    const IconComponent = data.icon;
    const isServerNode = data.label === "Server";
    const isServerLogsNode = data.label === "Server Logs";

    return (
        <div className="px-5 py-4 shadow-xl rounded-xl border-2 bg-gradient-to-br from-white to-gray-50 min-w-[180px] relative hover:shadow-2xl transition-all duration-200 hover:scale-105"
            style={{ borderColor: data.color }}>
            {/* Input Handle (left side) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-4 h-4 !border-2 !border-white shadow-md transition-all hover:scale-125"
                style={{ backgroundColor: data.color }}
            />

            <div className="flex items-center gap-3">
                <div
                    className="p-2.5 rounded-lg shadow-sm"
                    style={{ backgroundColor: data.color + "25" }}
                >
                    <IconComponent
                        className="size-6"
                        style={{ color: data.color }}
                    />
                </div>
                <div className="font-bold text-sm text-black">{data.label}</div>
            </div>

            {/* API Input for Server Node */}
            {isServerNode && (
                <div className="mt-3">
                    <Input
                        type="text"
                        placeholder="Enter API (e.g., 20.197.7.126:9100)"
                        value={data.apiEndpoint || ""}
                        onChange={(e) => data.onApiChange?.(id, e.target.value)}
                        className="text-xs h-8 text-black"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Log Input for Server Logs Node */}
            {isServerLogsNode && (
                <div className="mt-3">
                    <textarea
                        placeholder="Paste server logs here..."
                        value={data.logData || ""}
                        onChange={(e) => data.onLogChange?.(id, e.target.value)}
                        className="text-xs p-2 border rounded w-full h-24 text-black resize-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Output Handle (right side) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-4 h-4 !border-2 !border-white shadow-md transition-all hover:scale-125"
                style={{ backgroundColor: data.color }}
            />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

// Node type definitions
const nodeDefinitions = [
    {
        type: "server",
        label: "Server",
        icon: Server,
        color: "#3b82f6",
    },
    {
        type: "serverLogs",
        label: "Server Logs",
        icon: FileText,
        color: "#6366f1",
    },
    {
        type: "telemetry",
        label: "Telemetry",
        icon: Activity,
        color: "#8b5cf6",
    },
    {
        type: "prometheus",
        label: "Prometheus",
        icon: BarChart3,
        color: "#f97316",
    },
    {
        type: "sendMail",
        label: "Send Mail",
        icon: Mail,
        color: "#10b981",
    },
    {
        type: "sendSms",
        label: "Send SMS",
        icon: MessageSquare,
        color: "#06b6d4",
    },
    {
        type: "healthAgent",
        label: "Health Agent",
        icon: Shield,
        color: "#22c55e",
    },
    {
        type: "logAnalyzer",
        label: "Investigator Agent",
        icon: Shield,
        color: "#eab308",
    },
    {
        type: "reliabilityAgent",
        label: "Reliability Agent",
        icon: TrendingUp,
        color: "#10b981",
    },
];

export default function AutomationPage() {
    const router = useRouter();
    const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
    const [nodeId, setNodeId] = useState(0);
    const [metricsData, setMetricsData] = useState<string>("");
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Handle API endpoint change for server nodes
    const handleApiChange = useCallback((nodeId: string, apiEndpoint: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, apiEndpoint } }
                    : node
            )
        );
    }, [setNodes]);

    // Handle log data change for server logs nodes
    const handleLogChange = useCallback((nodeId: string, logData: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, logData } }
                    : node
            )
        );
    }, [setNodes]);

    // Add node to canvas
    const addNode = (nodeType: typeof nodeDefinitions[0]) => {
        const newNode: Node = {
            id: `${nodeType.type}-${nodeId}`,
            type: "custom",
            position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100,
            },
            data: {
                label: nodeType.label,
                icon: nodeType.icon,
                color: nodeType.color,
                apiEndpoint: "",
                logData: "",
                onApiChange: handleApiChange,
                onLogChange: handleLogChange,
            },
        };
        setNodes((nds) => [...nds, newNode]);
        setNodeId((id) => id + 1);
    };

    // Drag and drop handlers
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData("application/reactflow");
            if (!type) return;

            const nodeDef = nodeDefinitions.find((n) => n.type === type);
            if (!nodeDef) return;

            const reactFlowBounds = (
                event.target as HTMLElement
            ).getBoundingClientRect();
            const position = {
                x: event.clientX - reactFlowBounds.left - 80,
                y: event.clientY - reactFlowBounds.top - 20,
            };

            const newNode: Node = {
                id: `${nodeDef.type}-${nodeId}`,
                type: "custom",
                position,
                data: {
                    label: nodeDef.label,
                    icon: nodeDef.icon,
                    color: nodeDef.color,
                    apiEndpoint: "",
                    logData: "",
                    onApiChange: handleApiChange,
                    onLogChange: handleLogChange,
                },
            };

            setNodes((nds) => [...nds, newNode]);
            setNodeId((id) => id + 1);
        },
        [nodeId, setNodes]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    // Execute workflow - fetch metrics from server node
    const executeWorkflow = async () => {
        // Find nodes
        const prometheusNode = nodes.find(n => n.data.label === "Prometheus");
        const serverNode = nodes.find(n => n.data.label === "Server");
        const serverLogsNode = nodes.find(n => n.data.label === "Server Logs");
        const healthAgentNode = nodes.find(n => n.data.label === "Health Agent");
        const investigatorNode = nodes.find(n => n.data.label === "Investigator Agent");

        // Check for Server Logs → Investigator Agent workflow
        if (serverLogsNode && investigatorNode) {
            const isServerLogsInvestigatorConnected = edges.some(
                edge =>
                    (edge.source === serverLogsNode.id && edge.target === investigatorNode.id) ||
                    (edge.source === investigatorNode.id && edge.target === serverLogsNode.id)
            );

            if (isServerLogsInvestigatorConnected) {
                const logData = serverLogsNode.data.logData;
                if (!logData) {
                    alert("Please paste log data in the Server Logs node");
                    return;
                }

                setIsLoadingMetrics(true);
                setShowMetrics(true);

                console.log('Investigating server logs directly...');

                try {
                    // Directly investigate logs without metrics
                    const investigateResponse = await fetch('http://localhost:8000/automation/investigate-logs', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            log_data: logData
                        })
                    });

                    if (!investigateResponse.ok) {
                        const errorData = await investigateResponse.json();
                        throw new Error(errorData.detail || 'Failed to investigate logs');
                    }

                    const investigateResult = await investigateResponse.json();
                    console.log('Investigation result:', investigateResult);

                    // Store data for investigator observability page
                    const investigatorData = {
                        investigation: investigateResult.investigation,
                        metrics: [],
                        rawMetrics: null,
                        timestamp: new Date().toISOString(),
                        source: "Server Logs (Direct Input)"
                    };

                    localStorage.setItem('investigatorData', JSON.stringify(investigatorData));

                    // Format investigation for display in sidebar
                    const investigationDisplay = `
=== INVESTIGATION REPORT ===

Status: ${investigateResult.investigation.status.toUpperCase()}

${investigateResult.investigation.summary ? `
Log Analysis:
  Total Lines: ${investigateResult.investigation.summary.total_lines_scanned}
  Errors: ${investigateResult.investigation.summary.error_count}
  Critical: ${investigateResult.investigation.summary.critical_count}` : ''}

✅ Investigation complete! Redirecting to Investigator Dashboard...
                    `.trim();

                    setMetricsData(investigationDisplay);

                    // Navigate to investigator page after a short delay
                    setTimeout(() => {
                        router.push('/observability/investigator');
                    }, 2000);

                    setIsLoadingMetrics(false);
                    return; // Exit early for this workflow
                } catch (error) {
                    console.error("Error in workflow:", error);
                    setMetricsData(`Error: ${error instanceof Error ? error.message : String(error)}`);
                    setIsLoadingMetrics(false);
                    return;
                }
            }
        }

        // Check for Server Logs → Reliability Agent workflow (using Server node for metrics)
        const reliabilityNode = nodes.find(n => n.data.label === "Reliability Agent");
        if (serverNode && reliabilityNode) {
            const isServerReliabilityConnected = edges.some(
                edge =>
                    (edge.source === serverNode.id && edge.target === reliabilityNode.id) ||
                    (edge.source === reliabilityNode.id && edge.target === serverNode.id)
            );

            if (isServerReliabilityConnected) {
                const apiEndpoint = serverNode.data.apiEndpoint;
                if (!apiEndpoint) {
                    alert("Please enter an API endpoint in the Server node");
                    return;
                }

                setIsLoadingMetrics(true);
                setShowMetrics(true);

                console.log('Analyzing reliability from:', apiEndpoint);

                try {
                    // Step 1: Fetch metrics from server
                    const metricsResponse = await fetch('http://localhost:8000/automation/metrics', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            endpoint: apiEndpoint
                        })
                    });

                    if (!metricsResponse.ok) {
                        const errorData = await metricsResponse.json();
                        throw new Error(errorData.detail || 'Failed to fetch metrics');
                    }

                    const metricsResult = await metricsResponse.json();

                    // Step 2: Analyze reliability
                    const reliabilityResponse = await fetch('http://localhost:8000/automation/analyze-reliability', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            metrics_data: metricsResult.data
                        })
                    });

                    if (!reliabilityResponse.ok) {
                        const errorData = await reliabilityResponse.json();
                        throw new Error(errorData.detail || 'Failed to analyze reliability');
                    }

                    const reliabilityResult = await reliabilityResponse.json();
                    console.log('Reliability analysis result:', reliabilityResult);

                    // Store data for reliability observability page
                    const reliabilityData = {
                        reliability: reliabilityResult.reliability,
                        metrics: reliabilityResult.metrics,
                        rawMetrics: reliabilityResult.raw_metrics,
                        timestamp: new Date().toISOString(),
                        source: apiEndpoint
                    };

                    localStorage.setItem('reliabilityData', JSON.stringify(reliabilityData));

                    // Format reliability for display in sidebar
                    const reliabilityDisplay = `
=== RELIABILITY ANALYSIS ===

Score: ${reliabilityResult.reliability.reliability_score}
Status: ${reliabilityResult.reliability.status.toUpperCase()}

${reliabilityResult.reliability.predicted_risks?.length > 0 ? `\nPredicted Risks:\n${reliabilityResult.reliability.predicted_risks.map((risk: any) => `  - ${risk.type} (${Math.round(risk.probability * 100)}% probability)`).join('\n')}` : '\nNo risks predicted'}

✅ Analysis complete! Redirecting to Reliability Dashboard...
                    `.trim();

                    setMetricsData(reliabilityDisplay);

                    // Navigate to reliability page after a short delay
                    setTimeout(() => {
                        router.push('/observability/reliability');
                    }, 2000);

                    setIsLoadingMetrics(false);
                    return; // Exit early for this workflow
                } catch (error) {
                    console.error("Error in workflow:", error);
                    setMetricsData(`Error: ${error instanceof Error ? error.message : String(error)}`);
                    setIsLoadingMetrics(false);
                    return;
                }
            }
        }

        // Original Server + Prometheus workflow
        if (!prometheusNode || !serverNode) {
            alert("Please add both Prometheus and Server nodes");
            return;
        }

        // Check if Prometheus and Server are connected
        const isPrometheusServerConnected = edges.some(
            edge =>
                (edge.source === prometheusNode.id && edge.target === serverNode.id) ||
                (edge.source === serverNode.id && edge.target === prometheusNode.id)
        );

        if (!isPrometheusServerConnected) {
            alert("Please connect Prometheus and Server nodes");
            return;
        }

        const apiEndpoint = serverNode.data.apiEndpoint;
        if (!apiEndpoint) {
            alert("Please enter an API endpoint in the Server node");
            return;
        }

        // Check if Health Agent is connected to Prometheus
        const isHealthAgentConnected = healthAgentNode && edges.some(
            edge =>
                (edge.source === prometheusNode.id && edge.target === healthAgentNode.id) ||
                (edge.source === healthAgentNode.id && edge.target === prometheusNode.id)
        );

        // Check if Investigator (Log Analyzer) is connected to Prometheus
        const isInvestigatorConnected = investigatorNode && edges.some(
            edge =>
                (edge.source === prometheusNode.id && edge.target === investigatorNode.id) ||
                (edge.source === investigatorNode.id && edge.target === prometheusNode.id)
        );

        setIsLoadingMetrics(true);
        setShowMetrics(true);

        console.log('Fetching metrics from:', apiEndpoint);
        console.log('Health Agent connected:', isHealthAgentConnected);
        console.log('Investigator connected:', isInvestigatorConnected);

        try {
            // Step 1: Fetch metrics from server via Prometheus
            const metricsResponse = await fetch('http://localhost:8000/automation/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: apiEndpoint
                })
            });

            console.log('Metrics response status:', metricsResponse.status);

            if (!metricsResponse.ok) {
                const errorData = await metricsResponse.json();
                console.error('Error response:', errorData);
                throw new Error(errorData.detail || 'Failed to fetch metrics');
            }

            const metricsResult = await metricsResponse.json();
            console.log('Metrics fetched successfully');

            // Step 2: If Health Agent is connected, analyze health
            if (isHealthAgentConnected) {
                console.log('Analyzing health with Health Agent...');

                const healthResponse = await fetch('http://localhost:8000/automation/analyze-health', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        metrics_data: metricsResult.data
                    })
                });

                if (!healthResponse.ok) {
                    const errorData = await healthResponse.json();
                    throw new Error(errorData.detail || 'Failed to analyze health');
                }

                const healthResult = await healthResponse.json();
                console.log('Health analysis result:', healthResult);

                // Store data for observability page
                const observabilityData = {
                    health: {
                        health: healthResult.health_status,
                        issues: healthResult.issues
                    },
                    metrics: healthResult.metrics,
                    rawMetrics: healthResult.raw_metrics,  // Include raw Prometheus metrics
                    timestamp: new Date().toISOString(),
                    source: apiEndpoint
                };

                localStorage.setItem('observabilityData', JSON.stringify(observabilityData));

                // Format health analysis for display in sidebar
                const healthDisplay = `
=== HEALTH ANALYSIS ===

Status: ${healthResult.health_status.toUpperCase()}
${healthResult.issues.length > 0 ? `\nIssues Found:\n${healthResult.issues.map((issue: string) => `  - ${issue}`).join('\n')}` : '\nNo issues detected'}

=== KEY METRICS ===
${healthResult.metrics.map((m: any) => `${m.metric}: ${m.value}`).join('\n')}

✅ Data saved! Redirecting to Observability Dashboard...
                `.trim();

                setMetricsData(healthDisplay);

                // Navigate to observability page after a short delay
                setTimeout(() => {
                    router.push('/observability/prometheus');
                }, 2000);
            } else if (isInvestigatorConnected) {
                // Investigator Agent is connected
                console.log('Investigating with Investigator Agent...');

                const investigateResponse = await fetch('http://localhost:8000/automation/investigate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        metrics_data: metricsResult.data
                    })
                });

                if (!investigateResponse.ok) {
                    const errorData = await investigateResponse.json();
                    throw new Error(errorData.detail || 'Failed to investigate');
                }

                const investigateResult = await investigateResponse.json();
                console.log('Investigation result:', investigateResult);

                // Store data for investigator observability page
                const investigatorData = {
                    investigation: investigateResult.investigation,
                    metrics: investigateResult.metrics,
                    rawMetrics: investigateResult.raw_metrics,
                    timestamp: new Date().toISOString(),
                    source: apiEndpoint
                };

                localStorage.setItem('investigatorData', JSON.stringify(investigatorData));

                // Format investigation for display in sidebar
                const investigationDisplay = `
=== INVESTIGATION REPORT ===

Status: ${investigateResult.investigation.status.toUpperCase()}

${investigateResult.investigation.summary ? `
Log Analysis:
  Total Lines: ${investigateResult.investigation.summary.total_lines_scanned}
  Errors: ${investigateResult.investigation.summary.error_count}
  Critical: ${investigateResult.investigation.summary.critical_count}
  Metric Issues: ${investigateResult.investigation.summary.metric_issues_count}` : ''}

${investigateResult.investigation.metric_issues?.length > 0 ? `\nMetric Issues:\n${investigateResult.investigation.metric_issues.map((issue: string) => `  - ${issue}`).join('\n')}` : ''}

✅ Investigation complete! Redirecting to Investigator Dashboard...
                `.trim();

                setMetricsData(investigationDisplay);

                // Navigate to investigator page after a short delay
                setTimeout(() => {
                    router.push('/observability/investigator');
                }, 2000);
            } else {
                // No Health Agent or Investigator, show raw metrics
                console.log('No agent connected, showing raw metrics');
                setMetricsData(metricsResult.data);
            }

            console.log('Data displayed successfully');
        } catch (error) {
            console.error("Error in workflow:", error);
            setMetricsData(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoadingMetrics(false);
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b bg-background px-6 py-4 flex items-center gap-4 z-10">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push("/pipeline")}
                >
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-black">Workflow Automation</h1>
                    <p className="text-sm text-black">
                        Drag nodes from the palette and connect them to build your workflow
                    </p>
                </div>
                <Button
                    variant="default"
                    onClick={executeWorkflow}
                    disabled={isLoadingMetrics}
                    className="mr-2"
                >
                    {isLoadingMetrics ? "Loading..." : "Execute"}
                </Button>
                <Button variant="outline">Save Workflow</Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Node Palette */}
                <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
                    <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-black">
                        Node Palette
                    </h2>
                    <div className="space-y-3">
                        {nodeDefinitions.map((nodeDef) => {
                            const IconComponent = nodeDef.icon;
                            return (
                                <Card
                                    key={nodeDef.type}
                                    className="p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 hover:scale-102 bg-white border-2"
                                    style={{
                                        borderColor: nodeDef.color + "40",
                                    }}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, nodeDef.type)}
                                    onClick={() => addNode(nodeDef)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="p-2.5 rounded-lg shadow-sm"
                                            style={{
                                                backgroundColor: nodeDef.color + "25",
                                            }}
                                        >
                                            <IconComponent
                                                className="size-5"
                                                style={{ color: nodeDef.color }}
                                            />
                                        </div>
                                        <span className="font-semibold text-sm text-black">
                                            {nodeDef.label}
                                        </span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    <div className="mt-6 p-4 bg-blue-50/80 rounded-lg border border-blue-200 shadow-sm">
                        <p className="text-xs text-blue-900 leading-relaxed">
                            💡 <strong>Tip:</strong> Drag nodes onto the canvas or click to add them. Connect nodes by dragging from one node's edge to another.
                        </p>
                    </div>
                </div>

                {/* Center - React Flow Canvas */}
                <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-gradient-to-br from-gray-50 to-gray-100"
                        defaultEdgeOptions={{
                            animated: true,
                            style: { stroke: '#94a3b8', strokeWidth: 2 },
                        }}
                    >
                        <Controls className="!bg-white !shadow-xl !rounded-lg !border !border-gray-200 [&>button]:!text-gray-800 [&>button:hover]:!bg-gray-100" />
                        <MiniMap
                            nodeColor={(node) => {
                                return (node.data.color as string) || "#3b82f6";
                            }}
                            className="!bg-white !border !border-gray-200 !shadow-xl !rounded-lg"
                            maskColor="rgba(240, 240, 240, 0.6)"
                        />
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="#d1d5db" className="bg-gray-50" />
                    </ReactFlow>
                </div>

                {/* Right Sidebar - Metrics Display */}
                {showMetrics && (
                    <div className="w-96 border-l bg-white p-4 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg text-black">Metrics Data</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMetrics(false)}
                            >
                                Close
                            </Button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <pre className="text-xs whitespace-pre-wrap break-words font-mono text-black">
                                {metricsData || "No data available"}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
