import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import NetworkCanvas from '@/components/NetworkCanvas';
import StatsPanel from '@/components/StatsPanel';
import SpreadChart from '@/components/SpreadChart';
import SimControls from '@/components/SimControls';
import {
  SimNode, SimEdge, SimStats,
  DEFAULT_CONFIG, generateNetwork, simulationTick,
  applyFactCheck, applyAwarenessCampaign, getStats, applyForces,
} from '@/lib/simulation';

const CANVAS_W = 700;
const CANVAS_H = 500;

export default function Index() {
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [edges, setEdges] = useState<SimEdge[]>([]);
  const [tick, setTick] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [history, setHistory] = useState<SimStats[]>([]);
  const [factCheckMode, setFactCheckMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initNetwork = useCallback(() => {
    const { nodes: n, edges: e } = generateNetwork(DEFAULT_CONFIG, CANVAS_W, CANVAS_H);
    // Run force layout a few iterations
    let laid = n;
    for (let i = 0; i < 50; i++) {
      laid = applyForces(laid, e, CANVAS_W, CANVAS_H);
    }
    // Preserve states
    laid.forEach((node, i) => {
      node.state = n[i].state;
      node.infectedAt = n[i].infectedAt;
      node.connections = n[i].connections;
    });
    setNodes(laid);
    setEdges(e);
    setTick(0);
    setHistory([getStats(laid, 0)]);
    setIsRunning(false);
    setFactCheckMode(false);
  }, []);

  useEffect(() => {
    initNetwork();
  }, [initNetwork]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTick(prev => prev + 1);
        setNodes(prev => {
          const next = simulationTick(prev, DEFAULT_CONFIG, tick + 1);
          const stats = getStats(next, tick + 1);
          setHistory(h => {
            const newH = [...h, stats];
            return newH.length > 200 ? newH.slice(-200) : newH;
          });
          // Stop if no infected left
          if (stats.infected === 0) {
            setIsRunning(false);
          }
          return next;
        });
      }, 200 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, speed, tick]);

  const handleNodeClick = (nodeId: number) => {
    if (factCheckMode) {
      setNodes(prev => applyFactCheck(prev, nodeId));
      setFactCheckMode(false);
    }
  };

  const handleAwareness = () => {
    setNodes(prev => applyAwarenessCampaign(prev));
  };

  const currentStats = nodes.length > 0 ? getStats(nodes, tick) : { tick: 0, healthy: 0, infected: 0, recovered: 0, aware: 0 };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold font-mono text-primary text-glow-cyan tracking-tight">
          Misinformation Spread Simulator
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          SIR-model network propagation · Click nodes to fact-check · Deploy interventions to slow the spread
        </p>
      </motion.header>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Graph */}
        <motion.div
          className="bg-card rounded-xl border border-border p-3 glow-cyan"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Network · Tick {tick}
            </span>
          </div>
          <NetworkCanvas
            nodes={nodes}
            edges={edges}
            width={CANVAS_W}
            height={CANVAS_H}
            onNodeClick={factCheckMode ? handleNodeClick : undefined}
            tick={tick}
          />
          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs font-mono text-muted-foreground">
            {[
              { color: 'bg-sim-healthy', label: 'Healthy' },
              { color: 'bg-sim-infected', label: 'Infected' },
              { color: 'bg-sim-recovered', label: 'Fact-Checked' },
              { color: 'bg-sim-aware', label: 'Aware' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="flex flex-col gap-4 lg:w-72 shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <SimControls
            isRunning={isRunning}
            speed={speed}
            onToggleRun={() => setIsRunning(!isRunning)}
            onReset={initNetwork}
            onSpeedChange={setSpeed}
            onFactCheck={() => setFactCheckMode(!factCheckMode)}
            onAwareness={handleAwareness}
            factCheckMode={factCheckMode}
          />
          <StatsPanel stats={currentStats} totalNodes={nodes.length} />
          <SpreadChart history={history} />
        </motion.div>
      </div>
    </div>
  );
}
