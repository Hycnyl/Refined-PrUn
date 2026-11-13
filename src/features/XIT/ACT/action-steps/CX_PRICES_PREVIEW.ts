import { act } from '@src/features/XIT/ACT/act-registry';
import { changeSelectIndex } from '@src/util';
import { sleep } from '@src/utils/sleep';
import { watchUntil } from '@src/utils/watch';
import { cxobStore } from '@src/infrastructure/prun-api/data/cxob';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import { getCategoryById } from '@src/infrastructure/prun-api/data/material-categories';
import { getPrice } from '@src/infrastructure/fio/cx';
import { userData } from '@src/store/user-data';
import { showTileOverlay } from '@src/infrastructure/prun-ui/tile-overlay';
import PricesPreview from '@src/features/XIT/ACT/actions/cx-buy/PricesPreview.vue';
import {
  buildPreviewPurchase,
  formatPreviewPurchase,
  formatPreviewTotal,
  missingPriceTickers,
  rankPreviewPurchases,
  type PreviewBuy,
} from '@src/features/XIT/ACT/actions/cx-buy/prices-preview';
import { AssertFn } from '@src/features/XIT/ACT/shared-types';

const categoryLoadTimeoutMs = 10_000;

type WaitActFn = (status?: string, opts?: { actDelayMs?: number }) => Promise<void>;

interface Data {
  exchange: string;
  group: string;
  buys: PreviewBuy[];
}

export const CX_PRICES_PREVIEW = act.addActionStep<Data>({
  type: 'CX_PRICES_PREVIEW',
  description: data => `预览交易所价格：${data.group}，交易所 ${data.exchange}`,
  execute: async ctx => {
    const { data, log, setStatus, requestTile, waitAct, complete } = ctx;
    const assert: AssertFn = ctx.assert;
    const { exchange, buys } = data;
    assert(exchange, '缺少交易所');
    assert(buys.length > 0, '没有可预览的交易所采购');

    // Companion tile, unexpanded CX listing. Opening does not cost an extra ACT
    // click: EXECUTE started the run, and the category clicks below are the gates.
    // Requested even when every price is already loaded, because the preview panel
    // renders into this pane.
    const tile = await requestTile(`CX ${exchange}`, { actGate: false });
    if (!tile) {
      return;
    }

    const missing = missingPriceTickers(
      buys,
      exchange,
      cxTicker => cxobStore.getByTicker(cxTicker) !== undefined,
    );
    if (missing.length > 0) {
      await loadMissingCategoryPrices(tile, missing, exchange, log, waitAct, setStatus);
    }

    const thresholds = userData.settings.noBuyThresholds;
    const purchases = rankPreviewPurchases(
      buys.map(buy =>
        buildPreviewPurchase(
          buy,
          exchange,
          getPrice(buy.ticker),
          thresholds?.yellow ?? 10,
          thresholds?.red ?? 20,
        ),
      ),
    );
    const total = formatPreviewTotal(purchases);
    const lines = purchases.map(formatPreviewPurchase);

    // The preview belongs in the companion pane, not the run log: it opens at the top
    // with the total and the worst-priced tickers on screen, and the player pages down
    // through the rest instead of hunting for them in scrollback.
    const closePreview = showTileOverlay(
      tile.anchor,
      PricesPreview,
      {
        title: `交易所价格 - ${data.group}，交易所 ${exchange}`,
        total,
        lines,
      },
      // Unlike the per-buy price warning, this panel does not cover ACT, so a backdrop
      // click is a deliberate dismissal - and it is the player's only way out after a
      // SKIP, which never resumes this step.
      { dismissOnBackdrop: true },
    );
    if (closePreview === undefined) {
      // No overlay host in the CX pane. Logging is worse than the panel but far better
      // than silently dropping the numbers the player asked to see.
      log.warning(`无法在交易所显示价格预览：${exchange} 面板，改为在日志中显示`);
      log.info(total);
      for (const line of lines) {
        log.info(line);
      }
    }

    await waitAct(`检查交易所价格：${data.group}，交易所 ${exchange}`, { actDelayMs: 2000 });
    // Only runs on ACT. A SKIP drops everything after the await, and the panel then goes
    // with the pane when the next step retargets it.
    closePreview?.();
    complete();
  },
});

async function loadMissingCategoryPrices(
  tile: PrunTile,
  tickers: string[],
  exchange: string,
  log: { warning: (msg: string) => void },
  waitAct: WaitActFn,
  setStatus: (status: string) => void,
) {
  // $() resolves only once the element exists. Race it: setStatus() below grays ACT,
  // SKIP and CANCEL, so a CX tile that never renders its category selector would wedge
  // the run with no control left to the player.
  const select = (await Promise.race([$(tile.anchor, 'select'), sleep(categoryLoadTimeoutMs)])) as
    | HTMLSelectElement
    | undefined;
  if (select === undefined) {
    log.warning('未找到交易所类别选择器，使用已加载的价格');
    return;
  }

  const byCategory = new Map<string, string[]>();
  for (const ticker of tickers) {
    if (cxobStore.getByTicker(`${ticker}.${exchange}`) !== undefined) {
      continue;
    }
    const material = materialsStore.getByTicker(ticker);
    const categoryId = material?.category;
    if (categoryId === undefined) {
      log.warning(`未找到材料类别：${ticker}`);
      continue;
    }
    const list = byCategory.get(categoryId) ?? [];
    list.push(ticker);
    byCategory.set(categoryId, list);
  }

  let page = 0;
  for (const [categoryId, categoryTickers] of byCategory) {
    page++;
    const index = indexOfCategory(select, categoryId);
    if (index < 0) {
      log.warning(`交易所类别：${categoryTickers.join(', ')}未找到于 ${exchange}`);
      continue;
    }
    if (select.selectedIndex !== index) {
      // One player click per category page. The listing is never paged on its own; ACT
      // arms with no pre-delay, so this is as fast as the player can click.
      await waitAct(
        `点击“执行下一步”以显示 ${categoryLabel(select, index, categoryId)}，交易所 ${exchange} ` +
          `(${page}，目标 ${byCategory.size})`,
      );
      changeSelectIndex(select, index);
    }
    setStatus(`正在加载交易所 ${exchange} 的价格，材料 ${categoryTickers.join(', ')}...`);
    await sleep(0);
    const loaded = await waitForTickers(categoryTickers, exchange, categoryLoadTimeoutMs);
    if (!loaded) {
      // Say the load failed. Without this the preview's "no CX price data" line is the
      // only hint, and a silent timeout reads like an empty market.
      const stillMissing = categoryTickers.filter(
        ticker => cxobStore.getByTicker(`${ticker}.${exchange}`) === undefined,
      );
      log.warning(`交易所价格：${stillMissing.join(', ')}未加载于 ${exchange}`);
    }
  }
}

// Prefer the option text: that is the label the player is about to pick in the tile.
function categoryLabel(select: HTMLSelectElement, index: number, categoryId: string) {
  const text = select.options[index]?.textContent?.trim();
  if (text !== undefined && text.length > 0) {
    return text;
  }
  return getCategoryById(categoryId)?.name ?? '下一个类别';
}

function indexOfCategory(select: HTMLSelectElement, categoryId: string) {
  const options = Array.from(select.options);
  const byValue = options.findIndex(x => x.value === categoryId);
  if (byValue >= 0) {
    return byValue;
  }
  const category = getCategoryById(categoryId);
  const name = category?.name?.toUpperCase();
  if (name === undefined) {
    return -1;
  }
  return options.findIndex(x => x.textContent?.toUpperCase().includes(name));
}

async function waitForTickers(tickers: string[], exchange: string, timeoutMs: number) {
  const hasAll = () =>
    tickers.every(ticker => cxobStore.getByTicker(`${ticker}.${exchange}`) !== undefined);
  await Promise.race([watchUntil(hasAll), sleep(timeoutMs)]);
  return hasAll();
}
