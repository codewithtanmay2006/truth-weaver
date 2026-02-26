import { useRef, useEffect, useCallback } from 'react';
import { SimNode, SimEdge, NodeState } from '@/lib/simulation';

const STATE_COLORS: Record<NodeState, string> = {
  healthy: '#4ade80',   // green
  infected: '#ef4444',  // red
  recovered: '#3b82f6', // blue
  aware: '#eab308',     // yellow
};

const STATE_GLOW: Record<NodeState, string> = {
  healthy: 'rgba(74,222,128,0.2)',
  infected: 'rgba(239,68,68,0.4)',
  recovered: 'rgba(59,130,246,0.2)',
  aware: 'rgba(234,179,8,0.2)',
};

interface NetworkCanvasProps {
  nodes: SimNode[];
  edges: SimEdge[];
  width: number;
  height: number;
  onNodeClick?: (nodeId: number) => void;
  tick: number;
}

export default function NetworkCanvas({ nodes, edges, width, height, onNodeClick, tick }: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    ctx.lineWidth = 0.5;
    for (const edge of edges) {
      const a = nodes[edge.source];
      const b = nodes[edge.target];
      if (!a || !b) continue;

      const isActive = a.state === 'infected' || b.state === 'infected';
      ctx.strokeStyle = isActive
        ? 'rgba(239,68,68,0.3)'
        : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = isActive ? 1.5 : 0.5;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Draw nodes
    for (const node of nodes) {
      const color = STATE_COLORS[node.state];
      const glow = STATE_GLOW[node.state];
      const radius = node.state === 'infected' ? 7 + Math.sin(tick * 0.15) * 2 : 5;

      // Glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }, [nodes, edges, width, height, tick, dpr]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNodeClick) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const node of nodes) {
      if (Math.hypot(node.x - x, node.y - y) < 15) {
        onNodeClick(node.id);
        break;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width * dpr}
      height={height * dpr}
      style={{ width, height, cursor: onNodeClick ? 'crosshair' : 'default' }}
      onClick={handleClick}
      className="rounded-lg"
    />
  );
}
