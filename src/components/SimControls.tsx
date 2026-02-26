import { Play, Pause, RotateCcw, Shield, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SimControlsProps {
  isRunning: boolean;
  speed: number;
  onToggleRun: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onFactCheck: () => void;
  onAwareness: () => void;
  factCheckMode: boolean;
}

export default function SimControls({
  isRunning,
  speed,
  onToggleRun,
  onReset,
  onSpeedChange,
  onFactCheck,
  onAwareness,
  factCheckMode,
}: SimControlsProps) {
  return (
    <div className="space-y-4">
      {/* Playback */}
      <div className="flex gap-2">
        <Button
          onClick={onToggleRun}
          variant="default"
          size="sm"
          className="flex-1 font-mono text-xs"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5 mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
          {isRunning ? 'Pause' : 'Play'}
        </Button>
        <Button onClick={onReset} variant="secondary" size="sm" className="font-mono text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      {/* Speed */}
      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-2">
          Speed: {speed}x
        </label>
        <Slider
          value={[speed]}
          onValueChange={([v]) => onSpeedChange(v)}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
      </div>

      {/* Interventions */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Interventions
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={onFactCheck}
            variant={factCheckMode ? 'default' : 'secondary'}
            size="sm"
            className="font-mono text-xs justify-start"
          >
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            {factCheckMode ? 'Click a node…' : 'Fact-Check Node'}
          </Button>
          <Button
            onClick={onAwareness}
            variant="secondary"
            size="sm"
            className="font-mono text-xs justify-start"
          >
            <Megaphone className="w-3.5 h-3.5 mr-1.5" />
            Awareness Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
