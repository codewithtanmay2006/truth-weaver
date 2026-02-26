export type NodeState = 'healthy' | 'infected' | 'recovered' | 'aware';

export interface SimNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: NodeState;
  infectedAt: number;
  connections: number[];
}

export interface SimEdge {
  source: number;
  target: number;
}

export interface SimStats {
  tick: number;
  healthy: number;
  infected: number;
  recovered: number;
  aware: number;
}

export interface SimConfig {
  nodeCount: number;
  connectionDensity: number; // avg connections per node
  spreadProbability: number;
  recoveryTime: number; // ticks to recover
  initialInfected: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  nodeCount: 80,
  connectionDensity: 3,
  spreadProbability: 0.15,
  recoveryTime: 30,
  initialInfected: 2,
};

export function generateNetwork(config: SimConfig, width: number, height: number): { nodes: SimNode[]; edges: SimEdge[] } {
  const nodes: SimNode[] = [];
  const edges: SimEdge[] = [];
  const padding = 60;

  // Generate nodes with positions using force-directed-like placement
  for (let i = 0; i < config.nodeCount; i++) {
    nodes.push({
      id: i,
      x: padding + Math.random() * (width - padding * 2),
      y: padding + Math.random() * (height - padding * 2),
      vx: 0,
      vy: 0,
      state: 'healthy',
      infectedAt: -1,
      connections: [],
    });
  }

  // Create edges using proximity-based connection (Waxman model variant)
  const maxDist = Math.sqrt(width * width + height * height);
  for (let i = 0; i < config.nodeCount; i++) {
    // Sort others by distance
    const distances = nodes
      .map((n, j) => ({ j, dist: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y) }))
      .filter(d => d.j !== i)
      .sort((a, b) => a.dist - b.dist);

    const targetConns = Math.max(1, Math.floor(config.connectionDensity + (Math.random() - 0.5) * 2));
    let added = 0;
    for (const { j, dist } of distances) {
      if (added >= targetConns) break;
      if (nodes[i].connections.includes(j)) continue;
      // Probability decreases with distance
      const prob = Math.exp(-dist / (maxDist * 0.15));
      if (Math.random() < prob || added === 0) {
        nodes[i].connections.push(j);
        nodes[j].connections.push(i);
        edges.push({ source: i, target: j });
        added++;
      }
    }
  }

  // Set initial infected
  const shuffled = [...Array(config.nodeCount).keys()].sort(() => Math.random() - 0.5);
  for (let i = 0; i < config.initialInfected; i++) {
    nodes[shuffled[i]].state = 'infected';
    nodes[shuffled[i]].infectedAt = 0;
  }

  return { nodes, edges };
}

export function simulationTick(
  nodes: SimNode[],
  config: SimConfig,
  tick: number
): SimNode[] {
  const updated = nodes.map(n => ({ ...n }));

  for (const node of updated) {
    if (node.state === 'infected') {
      // Try to spread to neighbors
      for (const neighborId of node.connections) {
        const neighbor = updated[neighborId];
        if (neighbor.state === 'healthy') {
          if (Math.random() < config.spreadProbability) {
            neighbor.state = 'infected';
            neighbor.infectedAt = tick;
          }
        }
      }
      // Check recovery
      if (tick - node.infectedAt >= config.recoveryTime) {
        node.state = 'recovered';
      }
    }
  }

  return updated;
}

export function applyFactCheck(nodes: SimNode[], nodeId: number): SimNode[] {
  const updated = nodes.map(n => ({ ...n }));
  const node = updated[nodeId];
  if (node.state === 'infected') {
    node.state = 'recovered';
  }
  // Also immunize neighbors with some probability
  for (const nId of node.connections) {
    if (updated[nId].state === 'healthy' && Math.random() < 0.5) {
      updated[nId].state = 'aware';
    }
  }
  return updated;
}

export function applyAwarenessCampaign(nodes: SimNode[]): SimNode[] {
  const updated = nodes.map(n => ({ ...n }));
  const healthyNodes = updated.filter(n => n.state === 'healthy');
  // Make 20% of healthy nodes aware (immune)
  const count = Math.ceil(healthyNodes.length * 0.2);
  const shuffled = healthyNodes.sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    shuffled[i].state = 'aware';
  }
  return updated;
}

export function getStats(nodes: SimNode[], tick: number): SimStats {
  return {
    tick,
    healthy: nodes.filter(n => n.state === 'healthy').length,
    infected: nodes.filter(n => n.state === 'infected').length,
    recovered: nodes.filter(n => n.state === 'recovered').length,
    aware: nodes.filter(n => n.state === 'aware').length,
  };
}

// Simple force simulation for better layout
export function applyForces(nodes: SimNode[], edges: SimEdge[], width: number, height: number): SimNode[] {
  const updated = nodes.map(n => ({ ...n, vx: 0, vy: 0 }));
  const padding = 40;

  // Repulsion between all nodes
  for (let i = 0; i < updated.length; i++) {
    for (let j = i + 1; j < updated.length; j++) {
      const dx = updated[j].x - updated[i].x;
      const dy = updated[j].y - updated[i].y;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      const force = 800 / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      updated[i].vx -= fx;
      updated[i].vy -= fy;
      updated[j].vx += fx;
      updated[j].vy += fy;
    }
  }

  // Attraction along edges
  for (const edge of edges) {
    const a = updated[edge.source];
    const b = updated[edge.target];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const force = (dist - 80) * 0.01;
    const fx = (dx / Math.max(dist, 1)) * force;
    const fy = (dy / Math.max(dist, 1)) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Center gravity
  const cx = width / 2;
  const cy = height / 2;
  for (const node of updated) {
    node.vx += (cx - node.x) * 0.002;
    node.vy += (cy - node.y) * 0.002;
  }

  // Apply velocities with damping
  for (const node of updated) {
    node.x += node.vx * 0.5;
    node.y += node.vy * 0.5;
    node.x = Math.max(padding, Math.min(width - padding, node.x));
    node.y = Math.max(padding, Math.min(height - padding, node.y));
  }

  return updated;
}
