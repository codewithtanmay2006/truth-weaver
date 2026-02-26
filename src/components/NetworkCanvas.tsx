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

    // Draw edges with animated dash for active spread
    for (const edge of edges) {
      const a = nodes[edge.source];
      const b = nodes[edge.target];
      if (!a || !b) continue;

      const isActive = a.state === 'infected' || b.state === 'infected';
      const isSpreading = a.state === 'infected' && b.state === 'infected';

      ctx.strokeStyle = isSpreading
        ? 'rgba(239,68,68,0.5)'
        : isActive
        ? 'rgba(239,68,68,0.25)'
        : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = isSpreading ? 2 : isActive ? 1.2 : 0.5;

      if (isSpreading) {
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -tick * 2;
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw nodes
    for (const node of nodes) {
      const color = STATE_COLORS[node.state];
      const glow = STATE_GLOW[node.state];
      const isInfected = node.state === 'infected';
      const isAware = node.state === 'aware';
      const isRecovered = node.state === 'recovered';
      const radius = isInfected ? 7 + Math.sin(tick * 0.2) * 2.5 : isAware ? 6 : 5;

      // Outer glow ring
      const glowRadius = isInfected ? radius + 14 : isAware ? radius + 10 : radius + 6;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Inner glow
      if (isInfected || isAware) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = isInfected ? 'rgba(239,68,68,0.25)' : 'rgba(234,179,8,0.2)';
        ctx.fill();
      }

      // Node body
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Highlight dot
      ctx.beginPath();
      ctx.arc(node.x - radius * 0.3, node.y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();

      // Border
      ctx.strokeStyle = isRecovered ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isRecovered ? 1 : 0.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Shield icon for aware nodes
      if (isAware) {
        ctx.fillStyle = 'rgba(234,179,8,0.8)';
        ctx.font = `${radius}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', node.x, node.y);
      }
    }
  }, [nodes, edges, width, height, tick, dpr]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNodeClick) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (const node of nodes) {
      if (Math.hypot(node.x - x, node.y - y) < 20) {
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
