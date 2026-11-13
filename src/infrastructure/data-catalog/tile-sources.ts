import { createCollectionSource } from '@src/core/data-query/catalog';
import { DataSourceDescriptor } from '@src/core/data-query/types';
import { screensStore } from '@src/infrastructure/prun-api/data/screens';
import { tilesStore } from '@src/infrastructure/prun-api/data/tiles';
import { uiDataStore } from '@src/infrastructure/prun-api/data/ui-data';
import tiles from '@src/infrastructure/prun-ui/tiles';
import { userData } from '@src/store/user-data';
import { deepToRaw } from '@src/utils/deep-to-raw';

export interface StoredLayoutTileMetadata {
  id: string;
  parentId: string | null;
  screenId?: string;
  screenName?: string;
  content: string | null;
  command?: string;
  parameter?: string;
  container: PrunApi.TileContainer | null;
  gameState: Array<{ key: string; value: string }>;
  extensionState: Record<string, unknown>;
}

export interface RenderedTileMetadata {
  id: string;
  docked: boolean;
  fullCommand: string;
  command: string;
  parameter?: string;
  gameState: Array<{ key: string; value: string }>;
  extensionState: Record<string, unknown>;
}

export const tileDataSources: DataSourceDescriptor[] = [
  createCollectionSource({
    id: 'stored-layout-tiles',
    label: '已保存布局窗口',
    description: '已保存 PrUn 布局中可序列化的窗口节点及有限窗口状态。',
    provenance: 'prun-live',
    completeness: () => (tilesStore.fetched.value ? 'complete' : 'not-loaded'),
    snapshot: snapshotStoredLayoutTiles,
  }),
  createCollectionSource({
    id: 'active-rendered-tiles',
    label: '当前显示窗口',
    description: 'APEX 中当前显示窗口的可序列化元数据，不含 DOM 和框架对象。',
    provenance: 'prun-live',
    completeness: () => 'complete',
    snapshot: snapshotRenderedTiles,
  }),
];

export function snapshotStoredLayoutTiles(): StoredLayoutTileMetadata[] | undefined {
  const storedTiles = tilesStore.all.value;
  if (!storedTiles) {
    return undefined;
  }

  const screens = screensStore.all.value ?? [];
  const screensById = new Map(screens.map(x => [x.id, x]));
  const tilesById = new Map(storedTiles.map(x => [x.id, x]));

  return storedTiles.map(tile => {
    const screen = findScreen(tile, screensById, tilesById);
    const command = parseCommand(tile.content);
    return {
      id: tile.id,
      parentId: tile.parentId,
      ...(screen ? { screenId: screen.id, screenName: screen.name } : {}),
      content: tile.content,
      ...(command?.command ? { command: command.command } : {}),
      ...(command?.parameter ? { parameter: command.parameter } : {}),
      container: tile.container ? { ...tile.container } : null,
      gameState: getGameState(tile.id),
      extensionState: getExtensionState(tile.id),
    };
  });
}

export function snapshotRenderedTiles(): RenderedTileMetadata[] {
  return tiles.snapshotMetadata().map(tile => ({
    ...tile,
    gameState: getGameState(tile.id),
    extensionState: getExtensionState(tile.id),
  }));
}

export function getRenderedTileMetadata(id: string) {
  return snapshotRenderedTiles().find(x => x.id === id);
}

function findScreen(
  tile: PrunApi.Tile,
  screens: Map<string, PrunApi.Screen>,
  storedTiles: Map<string, PrunApi.Tile>,
) {
  let parentId = tile.parentId;
  const visited = new Set<string>();
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const screen = screens.get(parentId);
    if (screen) {
      return screen;
    }
    parentId = storedTiles.get(parentId)?.parentId ?? null;
  }
  return undefined;
}

function parseCommand(content: string | null) {
  if (!content) {
    return undefined;
  }
  const trimmed = content.trim();
  const space = trimmed.indexOf(' ');
  return {
    command: (space === -1 ? trimmed : trimmed.slice(0, space)).toUpperCase(),
    ...(space === -1 ? {} : { parameter: trimmed.slice(space + 1) }),
  };
}

function getGameState(id: string) {
  return (uiDataStore.tileStates ?? [])
    .filter(x => x.containerId === id)
    .map(x => ({ key: x.key, value: x.value }));
}

function getExtensionState(id: string) {
  return deepToRaw((userData.tileState[id] ?? {}) as Record<string, unknown>);
}
