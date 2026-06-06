"use client";

import { useMemo } from "react";
import type { GenLayerSource } from "@/types";

interface SourceGraphProps {
  supportingSources: GenLayerSource[];
  conflictingSources: GenLayerSource[];
}

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  isCenter?: boolean;
  isSupporting?: boolean;
  score: number;
  source?: GenLayerSource;
}

interface Edge {
  from: string;
  to: string;
  isSupporting: boolean;
}

export function SourceGraph({ supportingSources, conflictingSources }: SourceGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const allSources = [
      ...supportingSources.slice(0, 6).map((s) => ({ ...s, isSupporting: true })),
      ...conflictingSources.slice(0, 4).map((s) => ({ ...s, isSupporting: false })),
    ];

    const center: Node = {
      id: "center",
      label: "Claim",
      x: 250,
      y: 200,
      isCenter: true,
      score: 0,
    };

    const nodeList: Node[] = [center];
    const edgeList: Edge[] = [];

    allSources.forEach((source, i) => {
      const total = allSources.length;
      const angle = (2 * Math.PI * i) / total - Math.PI / 2;
      const radius = 140;
      const x = 250 + radius * Math.cos(angle);
      const y = 200 + radius * Math.sin(angle);

      const nodeId = `source-${i}`;
      nodeList.push({
        id: nodeId,
        label: source.domain || source.title || "Source",
        x,
        y,
        isSupporting: source.isSupporting,
        score: source.credibility_score || 0,
        source,
      });

      edgeList.push({
        from: "center",
        to: nodeId,
        isSupporting: source.isSupporting,
      });
    });

    return { nodes: nodeList, edges: edgeList };
  }, [supportingSources, conflictingSources]);

  if (supportingSources.length === 0 && conflictingSources.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-48">
        <p className="text-secondaryText text-sm">No sources to display</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-primaryText text-sm">Source Graph</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-credibilityGreen" />
            <span className="text-xs text-secondaryText">Supporting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-riskRed" />
            <span className="text-xs text-secondaryText">Conflicting</span>
          </div>
        </div>
      </div>

      <svg
        viewBox="0 0 500 400"
        className="w-full"
        style={{ maxHeight: "320px" }}
      >
        {edges.map((edge, i) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          return (
            <line
              key={i}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={edge.isSupporting ? "#16a34a" : "#ef4444"}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              strokeDasharray={edge.isSupporting ? "none" : "6 3"}
            />
          );
        })}

        {nodes.map((node) => {
          if (node.isCenter) {
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={28}
                  fill="#9d4edd"
                  fillOpacity="0.15"
                  stroke="#9d4edd"
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#241c35"
                >
                  Claim
                </text>
              </g>
            );
          }

          const fillColor = node.isSupporting ? "#16a34a" : "#ef4444";
          const label = node.label.length > 14 ? node.label.slice(0, 14) + "..." : node.label;

          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={20}
                fill={fillColor}
                fillOpacity="0.12"
                stroke={fillColor}
                strokeWidth="1.5"
              />
              <text
                x={node.x}
                y={node.y + 3}
                textAnchor="middle"
                fontSize="8"
                fill="#54486b"
              >
                {label}
              </text>
              <text
                x={node.x}
                y={node.y + 34}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={fillColor}
              >
                {node.score}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
