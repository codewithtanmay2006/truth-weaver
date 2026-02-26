import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
      const node = nodes[nodeId];
      setNodes(prev => applyFactCheck(prev, nodeId));
      setFactCheckMode(false);
      if (node?.state === 'infected') {
        toast.success('Fact-check applied!', {
          description: `Node ${nodeId} has been fact-checked. Nearby nodes may become aware.`,
        });
      } else {
        toast.info('Node was not infected', {
          description: `Node ${nodeId} is ${node?.state}. Neighbors may still gain awareness.`,
        });
      }
    }
  };

  const handleAwareness = () => {
    const healthyBefore = nodes.filter(n => n.state === 'healthy').length;
    setNodes(prev => applyAwarenessCampaign(prev));
    const affected = Math.ceil(healthyBefore * 0.2);
    toast.success('Awareness campaign launched!', {
      description: `~${affected} healthy nodes are now aware and immune to misinformation.`,
    });
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
        <div className="flex items-center gap-3 mb-1">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
          <h1 className="text-2xl md:text-3xl font-bold font-mono text-primary text-glow-cyan tracking-tight">
            Misinformation Spread Simulator
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-mono mt-1 ml-6">
          SIR-model network propagation · Click nodes to fact-check · Deploy interventions to slow the spread
        </p>
        {factCheckMode && (
          <motion.div
            className="mt-3 ml-6 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg text-xs font-mono text-primary"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🎯 Fact-check mode active — click any node on the network to apply
          </motion.div>
        )}
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
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs font-mono text-muted-foreground">
            {[
              { color: 'bg-sim-healthy', label: 'Healthy', desc: 'Susceptible' },
              { color: 'bg-sim-infected', label: 'Infected', desc: 'Spreading misinfo' },
              { color: 'bg-sim-recovered', label: 'Fact-Checked', desc: 'Immune' },
              { color: 'bg-sim-aware', label: 'Aware', desc: 'Inoculated' },
            ].map(({ color, label, desc }) => (
              <span key={label} className="flex items-center gap-1.5" title={desc}>
                <span className={`w-2.5 h-2.5 rounded-full ${color} ring-1 ring-white/10`} />
                <span>{label}</span>
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
