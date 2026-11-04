import React, { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AssetTransferLink } from '../../types/privacy';

interface ChartAsset {
  id: string;
  name: string;
  primaryHostingLocation?: string;
}

interface AssetNodeData extends Record<string, unknown> {
  label: string;
  location: string;
  role: 'source' | 'destination';
}

interface ActivityTransferChartProps {
  assets: ChartAsset[];
  sourceAssetId: string;
  destinationAssetIds: string[];
  links: AssetTransferLink[];
  editable?: boolean;
}

const nodeIdFor = (assetId: string) => `asset:${assetId}`;

const nodeStyle = (role: 'source' | 'destination'): React.CSSProperties => ({
  width: 190,
  border: role === 'source' ? '3px solid #6366f1' : '3px solid #10b981',
  borderRadius: 12,
  background: role === 'source' ? '#eef2ff' : '#ecfdf5',
  color: role === 'source' ? '#312e81' : '#064e3b',
  fontSize: 12,
  fontWeight: 400,
  textAlign: 'center',
  padding: '8px 10px',
  position: 'relative',
});

const handleStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderWidth: 1,
};

const AssetFlowNode = ({ data }: NodeProps<Node<AssetNodeData>>) => (
  <div style={nodeStyle(data.role)}>
    {data.role === 'destination' && (
      <Handle type="target" position={Position.Left} style={handleStyle} isConnectable={false} />
    )}
    <div>{data.label}</div>
    <div
      style={{
        marginTop: 6,
        paddingTop: 6,
        borderTop: data.role === 'source' ? '1px solid #c7d2fe' : '1px solid #a7f3d0',
        fontWeight: 700,
        textAlign: 'center',
      }}
    >
      {data.location}
    </div>
    <Handle type="source" position={Position.Right} style={handleStyle} isConnectable={false} />
  </div>
);

const nodeTypes = { asset: AssetFlowNode };

const chartFitView = { padding: 0.35, maxZoom: 1 };
const chartBackground = '#FCF9F4';

const ZoomedFitView = ({ nodeKey }: { nodeKey: string }) => {
  const { fitView } = useReactFlow();
  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        fitView({ ...chartFitView, duration: 0 });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [fitView, nodeKey]);
  return null;
};

const locationOf = (asset: ChartAsset | undefined, fallbackId: string) =>
  asset?.primaryHostingLocation?.trim() || (asset ? 'No primary hosting location recorded' : fallbackId);

export const ActivityTransferChart: React.FC<ActivityTransferChartProps> = ({
  assets,
  sourceAssetId,
  destinationAssetIds,
  links,
  editable = false,
}) => {
  const [nodes, setNodes] = useState<Node<AssetNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const source = assets.find(asset => asset.id === sourceAssetId);
  const destinationIds = useMemo(
    () => destinationAssetIds.filter(id => id && id !== sourceAssetId),
    [destinationAssetIds, sourceAssetId]
  );
  const visibleLinks = useMemo(
    () => links.filter(link => destinationIds.includes(link.toAssetId) && link.fromAssetId !== link.toAssetId),
    [destinationIds, links]
  );
  const layoutKey = [
    sourceAssetId,
    destinationIds.join(','),
    visibleLinks.map(link => `${link.id}:${link.fromAssetId}:${link.toAssetId}:${link.safeguard}`).join('|'),
    assets.map(asset => `${asset.id}:${asset.name}:${asset.primaryHostingLocation || ''}`).join('|'),
  ].join('::');

  useEffect(() => {
    setNodes(current => {
      const positionOf = (id: string, fallback: { x: number; y: number }) =>
        current.find(node => node.id === id)?.position || fallback;
      const next: Node<AssetNodeData>[] = [];
      if (source) {
        next.push({
          id: nodeIdFor(source.id),
          type: 'asset',
          position: positionOf(nodeIdFor(source.id), { x: 24, y: 120 }),
          data: { label: source.name, location: locationOf(source, source.id), role: 'source' },
          draggable: editable,
          deletable: false,
          selectable: false,
        });
      }
      destinationIds.forEach((assetId, index) => {
        const asset = assets.find(item => item.id === assetId);
        next.push({
          id: nodeIdFor(assetId),
          type: 'asset',
          position: positionOf(nodeIdFor(assetId), { x: 360, y: 24 + index * 110 }),
          data: { label: asset?.name || assetId, location: locationOf(asset, assetId), role: 'destination' },
          draggable: editable,
          deletable: false,
          selectable: false,
        });
      });
      return next;
    });

    setEdges(
      visibleLinks.map(link => ({
        id: link.id,
        source: nodeIdFor(link.fromAssetId),
        target: nodeIdFor(link.toAssetId),
        label: link.safeguard.trim() || undefined,
        labelStyle: { fontSize: 10, fontWeight: 700, fill: '#312e81' },
        labelBgStyle: { fill: '#eef2ff', fillOpacity: 0.95 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 6,
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#4f46e5' },
        style: { stroke: '#4f46e5', strokeWidth: 2 },
        deletable: false,
        reconnectable: false,
        selectable: false,
      }))
    );
  }, [assets, destinationIds, editable, layoutKey, source, visibleLinks]);

  const handleNodesChange = (changes: NodeChange<Node<AssetNodeData>>[]) => {
    setNodes(current => applyNodeChanges(changes.filter(change => change.type !== 'remove'), current));
  };

  if (!source) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
        <p className="text-xs font-semibold text-slate-600">Choose a source asset to map the transfer direction.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-bold text-slate-900">Data Flow Diagram</h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Choose each destination's source above. The chart shows those transfers, and each asset shows its hosting location.
        </p>
      </div>
      <div className="h-[420px] overflow-hidden rounded-xl border border-slate-200" style={{ backgroundColor: chartBackground }}>
        <ReactFlow
          style={{ backgroundColor: chartBackground }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          nodesDraggable={editable}
          nodesConnectable={false}
          connectOnClick={false}
          edgesReconnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          isValidConnection={() => false}
          fitView
          fitViewOptions={chartFitView}
        >
          <ZoomedFitView nodeKey={`${sourceAssetId}|${destinationIds.join(',')}`} />
          <Background gap={16} size={1} color="#EDE6DA" bgColor={chartBackground} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
};
