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
    Shield, // Health Agent Icon
    Play,
    Loader2
} from "lucide-react";

// Custom Node Component
const CustomNode = ({ data, id }: { data: any; id: string }) => {
    const IconComponent = data.icon;
    const isServerNode = data.label === "Server";
    const isPrometheusNode = data.label === "Prometheus";
    const isConfigurable = isServerNode || isPrometheusNode;

    return (
        <div className="px-5 py-4 shadow-lg rounded-xl border border-border bg-card text-card-foreground min-w-[200px] relative hover:ring-2 hover:ring-ring transition-all duration-200"
            style={{ borderLeftColor: data.color, borderLeftWidth: '4px' }}>

            {/* Input Handle (left side) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 !bg-muted-foreground transition-all hover:scale-125 backdrop-blur-sm"
            />

            <div className="flex items-center gap-3">
                <div
                    className="p-2.5 rounded-lg bg-muted"
                >
                    <IconComponent
                        className="size-5"
                        style={{ color: data.color }}
                    />
                </div>
                <div>
                    <div className="font-semibold text-sm">{data.label}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{data.subLabel || "Node"}</div>
                </div>
            </div>

            {/* Configuration Input */}
            {isConfigurable && (
                <div className="mt-3">
                    <label className="text-[10px] text-muted-foreground mb-1 block">API Endpoint / IP</label>
                    <Input
                        type="text"
                        placeholder={isPrometheusNode ? "http://demo...:9090" : "Server IP"}
                        value={data.apiEndpoint || ""}
                        onChange={(e) => data.onApiChange?.(id, e.target.value)}
                        className="h-7 text-xs bg-background"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Output Handle (right side) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 !bg-muted-foreground transition-all hover:scale-125"
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
        subLabel: "Infrastructure",
        icon: Server,
        color: "#3b82f6", // Blue
    },
    {
        type: "prometheus",
        label: "Prometheus",
        subLabel: "Telemetry Source",
        icon: BarChart3,
        color: "#f97316", // Orange
    },
    {
        type: "healthAgent",
        label: "Health Agent",
        subLabel: "AI Analysis",
        icon: Shield,
        color: "#ef4444", // Red
    },
    {
        type: "telemetry",
        label: "Telemetry",
        subLabel: "Visualization",
        icon: Activity,
        color: "#8b5cf6", // Purple
    },
    {
        type: "sendMail",
        label: "Send Mail",
        subLabel: "Notification",
        icon: Mail,
        color: "#10b981", // Emerald
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

    // Handle API endpoint change
    const handleApiChange = useCallback((nodeId: string, apiEndpoint: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, apiEndpoint } }
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
                x: Math.random() * 300 + 100,
                y: Math.random() * 200 + 100,
            },
            data: {
                label: nodeType.label,
                subLabel: nodeType.subLabel,
                icon: nodeType.icon,
                color: nodeType.color,
                apiEndpoint: "",
                onApiChange: handleApiChange,
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
                x: event.clientX - reactFlowBounds.left - 100,
                y: event.clientY - reactFlowBounds.top - 40,
            };

            const newNode: Node = {
                id: `${nodeDef.type}-${nodeId}`,
                type: "custom",
                position,
                data: {
                    label: nodeDef.label,
                    subLabel: nodeDef.subLabel,
                    icon: nodeDef.icon,
                    color: nodeDef.color,
                    apiEndpoint: "",
                    onApiChange: handleApiChange,
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

    // Execute workflow
    const executeWorkflow = async () => {
        setIsLoadingMetrics(true);
        setShowMetrics(false);

        try {
            // 1. Check for Prometheus -> Health Agent
            const prometheusNode = nodes.find(n => n.data.label === "Prometheus");
            const healthNode = nodes.find(n => n.data.label === "Health Agent");

            const isPrometheusConnectedToHealth = prometheusNode && healthNode && edges.some(
                edge => edge.source === prometheusNode.id && edge.target === healthNode.id
            );

            if (isPrometheusConnectedToHealth) {
                let endpoint = prometheusNode.data.apiEndpoint;
                const serverNode = nodes.find(n => n.data.label === "Server");
                if (!endpoint && serverNode && serverNode.data.apiEndpoint && edges.some(e => e.source === serverNode.id && e.target === prometheusNode.id)) {
                    endpoint = `http://${serverNode.data.apiEndpoint}:9090`;
                }

                // Fetch Health Data
                const healthUrl = new URL("http://localhost:8000/agents/health");
                if (endpoint) healthUrl.searchParams.append("url", endpoint);

                const response = await fetch(healthUrl.toString());
                if (!response.ok) throw new Error("Failed to fetch health agent analysis");

                const healthData = await response.json();

                // Fetch Normalized Metrics for visualization
                const normUrl = new URL("http://localhost:8000/telemetry/prometheus/normalized");
                if (endpoint) normUrl.searchParams.append("url", endpoint);

                const normRes = await fetch(normUrl.toString());
                const metrics = await normRes.json();

                // Save to localStorage for the dashboard to pick up
                const dashboardData = {
                    health: healthData,
                    metrics: metrics,
                    timestamp: new Date().toISOString(),
                    source: endpoint || "Demo Source"
                };
                localStorage.setItem("observabilityData", JSON.stringify(dashboardData));

                // Redirect
                router.push("/observability/prometheus");
                return;
            }

            // 2. Fallback: Old Server -> Telemetry Logic
            const serverNode = nodes.find(n => n.data.label === "Server");
            if (serverNode) {
                const apiEndpoint = serverNode.data.apiEndpoint;
                if (!apiEndpoint) {
                    alert("Please enter an API endpoint in the Server node");
                    return;
                }
                // Call old automation endpoint if exists, else show error
                // For now, implementing dummy old logic fetch or alert
                alert("Server execution flow is legacy. Please use Prometheus -> Health Agent.");
            } else {
                alert("Invalid Workflow. Connect Prometheus -> Health Agent.");
            }

        } catch (error) {
            console.error("Execution error:", error);
            alert(`Execution failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoadingMetrics(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background text-foreground">
            {/* Header */}
            <div className="border-b bg-background px-6 py-4 flex items-center gap-4 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/pipeline")}
                >
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">Workflow Builder</h1>
                    <p className="text-xs text-muted-foreground">
                        Design your observability pipeline
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">Save</Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={executeWorkflow}
                        disabled={isLoadingMetrics}
                    >
                        {isLoadingMetrics ? <><Loader2 className="mr-2 size-3 animate-spin" /> Executing</> : <><Play className="mr-2 size-3" /> Execute Workflow</>}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Node Palette */}
                <div className="w-64 border-r bg-muted/10 p-4 overflow-y-auto">
                    <h2 className="font-semibold mb-4 text-xs uppercase tracking-wide text-muted-foreground">
                        Nodes
                    </h2>
                    <div className="space-y-3">
                        {nodeDefinitions.map((nodeDef) => {
                            const IconComponent = nodeDef.icon;
                            return (
                                <div
                                    key={nodeDef.type}
                                    className="p-3 cursor-grab active:cursor-grabbing hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all flex items-center gap-3"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, nodeDef.type)}
                                    onClick={() => addNode(nodeDef)}
                                >
                                    <div
                                        className="p-2 rounded-md bg-background border shadow-sm"
                                    >
                                        <IconComponent
                                            className="size-4"
                                            style={{ color: nodeDef.color }}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">
                                            {nodeDef.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {nodeDef.subLabel}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Center - React Flow Canvas */}
                <div className="flex-1 bg-background relative">
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
                        className="bg-background"
                        isValidConnection={() => true}
                        defaultEdgeOptions={{
                            animated: true,
                            style: { stroke: '#3b82f6', strokeWidth: 2 }, // Bright Blue edges
                        }}
                    >
                        <Controls className="!bg-[#1e1e1e] !border !border-gray-700 !shadow-md [&>button]:!bg-[#1e1e1e] [&>button]:!fill-white [&>button]:!text-white [&>button:hover]:!bg-[#333] [&>button]:!border-b [&>button]:!border-gray-700" />
                        <MiniMap
                            nodeColor={(node) => {
                                return (node.data.color as string) || "#3b82f6";
                            }}
                            className="!bg-[#1e1e1e] !border !border-gray-700 !shadow-md"
                            maskColor="rgba(0, 0, 0, 0.7)"
                        />
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#ffffff" className="opacity-20" />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}
