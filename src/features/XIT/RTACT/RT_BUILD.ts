import ActionConfirmationOverlay from '@src/components/ActionConfirmationOverlay.vue';
import { act } from '@src/features/XIT/ACT/act-registry';
import { saveRouteRtId } from '@src/features/XIT/ROUTE/routes';
import {
  addWaypointArmed,
  clickControl,
  clickEditorSave,
  commandLabel,
  fillStepEditor,
  fillWaypointFlight,
  findEditor,
  findStepEdit,
  findWaypointScope,
  hasControl,
  locationValue,
  pickLocation,
  revealAssignments,
  revealHover,
  pressLoopSwitch,
  routeLoopOn,
  routeLoopToggle,
  snapshotRouteIds,
  stationName,
  stepEdits,
  tryAssignShip,
  waitForEditor,
  waitForNewRouteId,
  WAYPOINT_EDITOR_TITLE,
  waypointBlock,
} from '@src/features/XIT/RTACT/route-dom';
import {
  editorTitle,
  isShipmentStep,
  routeSummaryLines,
  shipmentRowText,
  stepSummary,
  type RouteStep,
  type RouteStop,
} from '@src/features/XIT/RTACT/route-spec';
import { shouldClickAddWaypoint, waypointNeedles } from '@src/features/XIT/RTACT/route-controls';
import { rtRunBlock } from '@src/features/XIT/RTACT/rt-host';
import { rtStageWindowSize } from '@src/features/XIT/RTACT/rt-stage-layout';
import { resizeSplitWindow, splitOwnerId } from '@src/infrastructure/prun-ui/companion-buffer';
import { AssertFn } from '@src/features/XIT/ACT/shared-types';
import { showTileOverlay } from '@src/infrastructure/prun-ui/tile-overlay';
import { clickElement } from '@src/util';
import { waitFor } from '@src/utils/wait-for';

interface Data {
  routeId?: string;
  shipId?: string;
  stops: RouteStop[];
  loop?: boolean;
  configRouteId?: string;
}

export const RT_BUILD = act.addActionStep<Data>({
  type: 'RT_BUILD',
  description: data => `创建路线（${data.stops.length} 个站点）`,
  previewLines: data =>
    routeSummaryLines({ stops: data.stops, loop: data.loop }, data.shipId?.trim()),
  execute: async ctx => {
    const { data, log, requestTile, waitAct, waitActionFeedback, fail, complete } = ctx;
    const assert: AssertFn = ctx.assert;
    const blocked = rtRunBlock(location.hostname);
    if (blocked !== undefined) {
      fail(blocked);
      return;
    }

    let routeId = data.routeId?.trim() ?? '';
    let tile: PrunTile | undefined;
    if (routeId.length > 0) {
      tile = await requestTile(`RT ${routeId}`);
      if (tile !== undefined) {
        await applyRtStageLayout(tile);
      }
    } else {
      const list = await requestTile('RT');
      if (list === undefined) {
        return;
      }
      // Size the panes as soon as RT opens, not after the route exists.
      await applyRtStageLayout(list);
      await waitAct('创建路线？');
      // The RT list can render its buttons after the tile opens.
      await waitFor(() => hasControl(list.anchor, 'CREATE ROUTE'), 8000);
      const before = snapshotRouteIds(list.anchor);
      try {
        await clickControl(list.anchor, 'CREATE ROUTE');
      } catch (err) {
        fail(err instanceof Error ? err.message : '无法点击 CREATE ROUTE');
        return;
      }
      await waitActionFeedback(list);
      const created = await waitForNewRouteId(list.anchor, before);
      assert(created !== undefined, '未发现新路线编号');
      log.info(`已创建 ${created}`);
      routeId = created;
      tile = await requestTile(`RT ${created}`, { actGate: false });
    }
    if (tile === undefined) {
      return;
    }
    // The RT list tile turns into the new route by itself, and its tile entry can
    // still hold the list's content for a while. Use the entry that shows the editor.
    const command = `RT ${routeId}`;
    let editor: PrunTile | undefined;
    await waitFor(() => {
      editor = tiles
        .find(command, true)
        .find(x => x.anchor.isConnected && hasControl(x.anchor, 'ADD WAYPOINT'));
      return editor !== undefined;
    }, 8000);
    if (editor === undefined) {
      fail(`未找到 ${command} 编辑器`);
      return;
    }
    tile = editor;
    await applyRtStageLayout(tile);
    saveRouteRtId(data.configRouteId, routeId);

    for (const stop of data.stops) {
      const ok = await addStop(ctx, tile, stop);
      if (!ok) {
        return;
      }
    }
    if (data.loop !== undefined) {
      const looped = await setRouteLoop(ctx, tile, data.loop);
      if (!looped) {
        return;
      }
    }
    log.success('路线站点已配置。');
    const ship = data.shipId?.trim() ?? '';
    if (ship.length > 0 && !(await confirmAssign(ctx.actTile, ship, routeId))) {
      log.info(`${routeId} 已创建，但未分配飞船。请分配 ${ship} 以开始路线。`);
      complete();
      return;
    }
    if (ship.length > 0) {
      const ok = await assignShip(ctx, tile, ship, routeId);
      if (!ok) {
        return;
      }
    }
    complete();
  },
});

async function applyRtStageLayout(tile: PrunTile) {
  const windowEl = tile.frame.closest(`.${C.Window.window}`) as HTMLElement | null;
  const ownerId = splitOwnerId(windowEl);
  if (ownerId === undefined) {
    return;
  }
  const bodyEl = _$(windowEl!, C.Window.body) as HTMLElement | null;
  const layout = rtStageWindowSize(parseInt(bodyEl?.style.height ?? '', 10));
  await resizeSplitWindow(ownerId, layout.actWidth, layout.rtWidth, layout.height);
}

async function addStop(
  ctx: {
    waitAct: (status?: string) => Promise<void>;
    waitSkipOr: (status: string, event: Promise<void>) => Promise<'skip' | 'ready'>;
    waitActionFeedback: (tile: PrunTile) => Promise<void>;
    fail: (message?: string) => void;
    assert: AssertFn;
    log: { info: (message: string) => void };
  },
  tile: PrunTile,
  stop: RouteStop,
): Promise<boolean> {
  const { waitAct, waitActionFeedback, fail, log } = ctx;
  const assert: AssertFn = ctx.assert;
  await waitAct(`添加途经点 ${stop.query}?`);
  const picked = await pickLocation(tile.anchor, stop.query);
  const armed = addWaypointArmed(tile.anchor);
  if (!shouldClickAddWaypoint({ suggestionPicked: picked, armed })) {
    // The field can keep stale text such as an earlier ZV-307. Let the player
    // pick the suggestion, then require that pick to name this stop.
    await waitAct(`请选择 ${stop.query} 到位置输入框，然后点击“执行下一步”`);
    // A picked station reads as its system id, e.g. ZV-307 for Antares Station.
    const raw = locationValue(tile.anchor);
    const query = stop.query.toLowerCase();
    const named = [raw, stationName(raw, raw) ?? ''].some(x => x.toLowerCase().includes(query));
    if (!addWaypointArmed(tile.anchor)) {
      fail(`ADD WAYPOINT 尚不可用，位置 ${stop.query}。必须选择搜索建议，直接输入文字不会生效。`);
      return false;
    }
    if (!named) {
      fail(`位置输入框内容为“${raw}”，应为 ${stop.query}.`);
      return false;
    }
  }
  try {
    await clickControl(tile.anchor, 'ADD WAYPOINT', { requireArmed: true });
  } catch (err) {
    fail(err instanceof Error ? err.message : '无法点击 ADD WAYPOINT');
    return false;
  }
  await waitActionFeedback(tile);
  const canonical = locationValue(tile.anchor);
  const needles = waypointNeedles(stop.query, canonical, stationName(stop.query, canonical));
  const appeared = await waitFor(() => findWaypointScope(tile.anchor, needles) !== undefined, 8000);
  assert(appeared, `未找到新途经点：${stop.query}`);
  log.info(`途经点 ${canonical.length > 0 ? canonical : stop.query}`);

  for (const step of stop.steps) {
    const ok = await addStep(ctx, tile, needles, stop, step);
    if (!ok) {
      return false;
    }
  }
  if (!hasWaypointFlight(stop)) {
    return true;
  }
  return await saveWaypointFlight(ctx, tile, needles, stop);
}

function hasWaypointFlight(stop: RouteStop): boolean {
  return (
    stop.fuelUsage !== undefined || stop.reactorUsage !== undefined || stop.gateway !== undefined
  );
}

async function saveWaypointFlight(
  ctx: {
    waitAct: (status?: string) => Promise<void>;
    fail: (message?: string) => void;
    log: { info: (message: string) => void };
  },
  tile: PrunTile,
  needles: string[],
  stop: RouteStop,
): Promise<boolean> {
  const { waitAct, fail, log } = ctx;
  const scope = findWaypointScope(tile.anchor, needles);
  if (scope === undefined) {
    fail(`未找到途经点：${stop.query}`);
    return false;
  }
  const block = waypointBlock(scope);
  revealHover(block);
  try {
    await clickControl(block, WAYPOINT_EDITOR_TITLE);
  } catch (err) {
    fail(err instanceof Error ? err.message : '无法打开途经点编辑器');
    return false;
  }
  const title = WAYPOINT_EDITOR_TITLE;
  let editor: Element | undefined;
  await waitFor(() => {
    editor = findEditor(tile.anchor, title);
    return editor !== undefined;
  }, 8000);
  if (editor === undefined) {
    fail(`未找到 ${title}`);
    return false;
  }
  let filled: string;
  try {
    filled = await fillWaypointFlight(editor, stop, waitAct);
  } catch (err) {
    fail(err instanceof Error ? err.message : `无法填写 ${title}`);
    return false;
  }
  log.info(`已填写 ${title}，对象 ${stop.query}: ${filled}`);
  await waitAct(`保存 ${title}?`);
  const current = findEditor(tile.anchor, title);
  if (current === undefined) {
    fail(`${title} 在保存前关闭`);
    return false;
  }
  try {
    await clickEditorSave(current);
  } catch (err) {
    fail(err instanceof Error ? err.message : `无法点击保存，位置 ${title}`);
    return false;
  }
  const closed = await waitFor(() => findEditor(tile.anchor, title) === undefined, 8000);
  if (!closed) {
    fail(`${title} 在保存后仍打开`);
    return false;
  }
  await dismissSaveFeedback(tile);
  return true;
}

async function setRouteLoop(
  ctx: {
    waitAct: (status?: string) => Promise<void>;
    fail: (message?: string) => void;
    log: { info: (message: string) => void };
  },
  tile: PrunTile,
  on: boolean,
): Promise<boolean> {
  const { waitAct, fail, log } = ctx;
  const current = routeLoopToggle(tile.frame);
  if (current === undefined) {
    fail('未找到循环开关');
    return false;
  }
  if (routeLoopOn(current) === on) {
    log.info(on ? '循环已开启' : '循环已关闭');
    return true;
  }
  await waitAct(on ? '开启路线循环？' : '关闭路线循环？');
  const toggle = routeLoopToggle(tile.frame);
  if (toggle === undefined) {
    fail('未找到循环开关');
    return false;
  }
  if (routeLoopOn(toggle) === on) {
    return true;
  }
  try {
    await pressLoopSwitch(toggle);
  } catch (err) {
    fail(err instanceof Error ? err.message : '无法点击循环开关');
    return false;
  }
  const flipped = await waitFor(() => loopIs(tile.frame, on), 1500);
  if (!flipped) {
    await waitAct(on ? '请开启循环，然后点击“执行下一步”' : '请关闭循环，然后点击“执行下一步”');
  }
  const done = await waitFor(() => loopIs(tile.frame, on), 1500);
  if (!done) {
    fail(on ? '循环仍为关闭状态' : '循环仍为开启状态');
    return false;
  }
  await dismissSaveFeedback(tile);
  log.info(on ? '循环已开启' : '循环已关闭');
  return true;
}

function loopIs(root: Element, on: boolean): boolean {
  const next = routeLoopToggle(root);
  return next !== undefined && routeLoopOn(next) === on;
}

async function addStep(
  ctx: {
    waitAct: (status?: string) => Promise<void>;
    fail: (message?: string) => void;
    log: { info: (message: string) => void };
  },
  tile: PrunTile,
  needles: string[],
  stop: RouteStop,
  step: RouteStep,
): Promise<boolean> {
  const { waitAct, fail, log } = ctx;
  const command = commandLabel(step);
  const summary = stepSummary(step);
  await waitAct(`添加 ${summary} 于 ${stop.query}?`);
  const scope = findWaypointScope(tile.anchor, needles);
  if (scope === undefined) {
    fail(`未找到途经点：${stop.query}`);
    return false;
  }
  revealHover(scope);
  await waitFor(() => findLabeled(scope, command), 1500);
  if (isShipmentStep(step)) {
    // A shipment step has no editor and no SAVE: the click adds it filled in, so the new
    // row's text is the only signal.
    const rowText = shipmentRowText(step);
    const rowsBefore = textCount(tile.anchor, rowText);
    try {
      await clickControl(scope, command);
    } catch (err) {
      fail(err instanceof Error ? err.message : `无法点击 ${command}`);
      return false;
    }
    const added = await waitFor(() => {
      const fresh = findWaypointScope(tile.anchor, needles);
      const block = fresh === undefined ? undefined : waypointBlock(fresh);
      return (
        block !== undefined &&
        textCount(block, rowText) > 0 &&
        textCount(tile.anchor, rowText) > rowsBefore
      );
    }, 8000);
    if (!added) {
      fail(`未找到新增的 ${command} 步骤，位置 ${stop.query}`);
      return false;
    }
    log.info(`已添加 ${summary} 于 ${stop.query}`);
    return true;
  }
  // Count the whole route: an empty waypoint's block resolves to the full list, so a
  // per-block count would include the earlier waypoints' pencils.
  const editsBefore = stepEdits(tile.anchor).length;
  try {
    await clickControl(scope, command);
  } catch (err) {
    fail(err instanceof Error ? err.message : `无法点击 ${command}`);
    return false;
  }
  // Adding a step shows no action feedback overlay; the new step row is the signal.
  let edit: HTMLElement | undefined;
  await waitFor(() => {
    const fresh = findWaypointScope(tile.anchor, needles);
    const block = fresh === undefined ? undefined : waypointBlock(fresh);
    if (block !== undefined) {
      revealHover(block);
    }
    edit =
      block === undefined || stepEdits(tile.anchor).length <= editsBefore
        ? undefined
        : findStepEdit(block);
    return edit !== undefined;
  }, 8000);
  if (edit === undefined) {
    fail(`未找到编辑控件：${command} 于 ${stop.query}`);
    return false;
  }
  try {
    await clickEdit(edit);
  } catch (err) {
    fail(err instanceof Error ? err.message : `无法打开 ${command}`);
    return false;
  }
  const editor = await waitForEditor(tile.anchor, step);
  if (editor === undefined) {
    fail(`未找到 ${editorTitle(step)}`);
    return false;
  }
  try {
    await fillStepEditor(editor, step);
  } catch (err) {
    fail(err instanceof Error ? err.message : `无法填写 ${editorTitle(step)}`);
    return false;
  }
  const title = editorTitle(step);
  log.info(`已填写 ${title} 于 ${stop.query}: ${summary}`);
  await waitAct(`保存 ${title}?`);
  const current = findEditor(tile.anchor, title);
  if (current === undefined) {
    fail(`${title} 在保存前关闭`);
    return false;
  }
  try {
    await clickEditorSave(current);
  } catch (err) {
    fail(err instanceof Error ? err.message : `无法点击保存，位置 ${title}`);
    return false;
  }
  // The editor's outer element survives SAVE (the tile swaps its contents), so poll for the
  // title instead of waiting for that element to disconnect.
  const closed = await waitFor(() => findEditor(tile.anchor, title) === undefined, 8000);
  if (!closed) {
    fail(`${title} 在保存后仍打开`);
    return false;
  }
  await dismissSaveFeedback(tile);
  return true;
}

// The SAVE leaves a success overlay on the route tile; clear it before the next click.
async function dismissSaveFeedback(tile: PrunTile): Promise<void> {
  const find = () => _$(tile.frame, C.ActionFeedback.success) as HTMLElement | undefined;
  await waitFor(() => find() !== undefined, 2000);
  const success = find();
  if (success !== undefined) {
    await clickElement(success);
  }
}

// Assigning the ship starts the route, so the player chooses now or later.
// Only the overlay's own buttons answer: it covers ACT, which may be mid-spam.
function confirmAssign(actTile: PrunTile, ship: string, routeId: string) {
  return new Promise<boolean>(resolve => {
    let assign = false;
    const close = showTileOverlay(
      actTile.anchor,
      ActionConfirmationOverlay,
      {
        message: `分配 ${ship} 到 ${routeId}？分配后路线会立即开始。取消则保留已创建的路线，可稍后再分配飞船启动。`,
        confirmLabel: '立即分配',
        onConfirm: () => {
          assign = true;
          close?.();
        },
      },
      { onClosed: () => resolve(assign), dismissOnBackdrop: false },
    );
  });
}

async function assignShip(
  ctx: {
    waitAct: (status?: string) => Promise<void>;
    fail: (message?: string) => void;
    log: { success: (message: string) => void; warning: (message: string) => void };
  },
  tile: PrunTile,
  ship: string,
  routeId: string,
): Promise<boolean> {
  const { waitAct, log } = ctx;
  // The route itself is built by now. Stop on the RT view's Assignments list so the
  // player can assign another ship there.
  const result = await tryAssignShip({
    anchor: tile.anchor,
    frame: tile.frame,
    ship,
    routeId,
    waitAct,
  });
  if (result.ok) {
    log.success(result.already ? `${ship} 已分配到 ${routeId}` : `已分配 ${ship} 到 ${routeId}`);
    return true;
  }
  log.warning(
    `${result.reason}. ${routeId} 已创建，但未分配 ${ship}。请在右侧分配列表中选择飞船。`,
  );
  revealAssignments(tile.anchor);
  ctx.fail();
  return false;
}

function textCount(root: Element, text: string): number {
  return (root.textContent ?? '').split(text).length - 1;
}

function findLabeled(root: Element, label: string): boolean {
  const wanted = label.toLowerCase();
  return Array.from(root.querySelectorAll('button, a, [role="button"]')).some(
    el => (el.textContent ?? '').trim().toLowerCase() === wanted,
  );
}

async function clickEdit(el: HTMLElement): Promise<void> {
  const label = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim();
  if (/delete/i.test(label)) {
    throw new Error(`拒绝激活删除控件（${label})`);
  }
  await clickElement(el);
}
