import { act } from '@src/features/XIT/ACT/act-registry';
import { fixed0, fixed02 } from '@src/utils/format';
import { changeInputValue, clickElement } from '@src/util';
import { fillAmount } from '@src/features/XIT/ACT/actions/cx-buy/utils';
import {
  priceExcessLevel,
  resolveCxBuyPrice,
} from '@src/features/XIT/ACT/actions/cx-buy/price-threshold';
import PriceThresholdWarning from '@src/features/XIT/ACT/actions/cx-buy/PriceThresholdWarning.vue';
import { showTileOverlay } from '@src/infrastructure/prun-ui/tile-overlay';
import { getPrice } from '@src/infrastructure/fio/cx';
import { userData } from '@src/store/user-data';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { exchangesStore } from '@src/infrastructure/prun-api/data/exchanges';
import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { watchWhile } from '@src/utils/watch';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import { watchEffect } from 'vue';
import { AssertFn } from '@src/features/XIT/ACT/shared-types';

interface Data {
  exchange: string;
  ticker: string;
  amount: number;
  priceLimit: number;
  allowUnfilled: boolean;
}

export const CXPO_BUY = act.addActionStep<Data>({
  type: 'CXPO_BUY',
  preProcessData: data => ({ ...data, ticker: data.ticker.toUpperCase() }),
  description: data => {
    const { ticker, exchange } = data;
    const cxTicker = `${ticker}.${exchange}`;
    const filled = fillAmount(cxTicker, data.amount, data.priceLimit);
    const amount = filled?.amount ?? data.amount;
    const priceLimit = filled?.priceLimit ?? data.priceLimit;
    const allowUnfilled = data.allowUnfilled ?? false;
    const willFillCompletely = filled && filled.amount === data.amount;

    if (!willFillCompletely && allowUnfilled) {
      let description = `挂单购买 ${fixed0(data.amount)} ${ticker}，交易所 ${exchange}`;
      if (isFinite(priceLimit)) {
        description += `，价格 ${fixed02(data.priceLimit)}`;
        description += ` (${fixed0(data.amount * data.priceLimit)} 总成本）`;
      }
      return description;
    }

    let description = `购买 ${fixed0(amount)} ${ticker}，交易所 ${exchange}`;
    if (isFinite(priceLimit)) {
      description += `，价格限制 ${fixed02(priceLimit)}`;
    }
    if (filled) {
      description += ` (${fixed0(filled.cost)} 总成本）`;
    } else {
      description += '（暂无价格数据）';
    }
    return description;
  },
  execute: async ctx => {
    const { data, log, setStatus, requestTile, waitAct, waitActionFeedback, complete, skip, fail } =
      ctx;
    const assert: AssertFn = ctx.assert;
    const { amount, ticker, exchange, priceLimit } = data;
    const cxTicker = `${ticker}.${exchange}`;
    const cxWarehouse = computed(() => {
      const naturalId = exchangesStore.getNaturalIdFromCode(exchange);
      const warehouse = warehousesStore.getByEntityNaturalId(naturalId);
      return storagesStore.getById(warehouse?.storeId);
    });
    assert(cxWarehouse.value, `未找到交易所仓库：${exchange}`);

    if (amount <= 0) {
      log.warning(`未购买 ${ticker}（目标数量为 0）`);
      skip();
      return;
    }

    const material = materialsStore.getByTicker(ticker);
    assert(material, `未知材料 ${ticker}`);

    const canFitWeight =
      material.weight * amount <= cxWarehouse.value.weightCapacity - cxWarehouse.value.weightLoad;
    const canFitVolume =
      material.volume * amount <= cxWarehouse.value.volumeCapacity - cxWarehouse.value.volumeLoad;
    assert(canFitWeight && canFitVolume, `无法购买 ${fixed0(amount)} ${ticker}（仓库容量不足）`);

    const tile = await requestTile(`CXPO ${cxTicker}`);
    if (!tile) {
      return;
    }

    setStatus('正在配置 CXPO 窗口……');

    const buyButton = await $(tile.anchor, C.Button.success);
    const form = await $(tile.anchor, C.ComExPlaceOrderForm.form);
    const inputs = _$$(form, 'input');
    const quantityInput = inputs[0];
    assert(quantityInput !== undefined, '缺少数量输入框');
    const priceInput = inputs[1];
    assert(priceInput !== undefined, '缺少价格输入框');

    let shouldUnwatch = false;
    let missingOrderBook = false;
    let skippedEmptyBook = false;
    // The first effect run is inside watchEffect's constructor, while `unwatch`
    // is still initializing. Later runs can stop the watcher before skip().
    let watcherReady = false;
    let lastShortageWarning: string | undefined;
    const unwatch = watchEffect(() => {
      if (shouldUnwatch) {
        unwatch();
        return;
      }

      const filled = fillAmount(cxTicker, amount, priceLimit);

      if (!filled) {
        shouldUnwatch = true;
        missingOrderBook = true;
        return;
      }

      if (filled.amount < amount && !data.allowUnfilled) {
        const leftover = amount - filled.amount;
        let message =
          `${fixed0(leftover)} ${ticker} 不会购买于 ${exchange} ` +
          `(${fixed0(filled.amount)}，目标 ${fixed0(amount)} 可用`;
        if (isFinite(priceLimit)) {
          message += `，价格限制 ${fixed02(priceLimit)}/u`;
        }
        message += ')';
        // The order book keeps updating while the buffer is open, so this effect
        // reruns on every change. Only log a shortage when it actually changed.
        if (message !== lastShortageWarning) {
          lastShortageWarning = message;
          log.warning(message);
        }
        if (filled.amount === 0) {
          // Calling skip() starts the next commodity and does not unwind execute.
          // Stop the watcher first so a later book tick cannot skip that
          // commodity too. The first run cannot call unwatch yet.
          shouldUnwatch = true;
          skippedEmptyBook = true;
          if (watcherReady) {
            unwatch();
          }
          skip();
          return;
        }
      }

      if (data.allowUnfilled) {
        changeInputValue(quantityInput, data.amount.toString());
        changeInputValue(priceInput, fixed02(data.priceLimit));
      } else {
        changeInputValue(quantityInput, filled.amount.toString());
        changeInputValue(priceInput, fixed02(filled.priceLimit));
      }

      // Cache description before clicking the buy button because
      // order book data will change after that.
      ctx.cacheDescription();
    });
    watcherReady = true;
    // Vue's watchEffect swallows a throw, so fail from the step body once the book is missing.
    if (missingOrderBook) {
      fail(`缺少 ${cxTicker} 订单簿数据`);
    }
    // An empty book is often known on that first effect run, before waitAct.
    // Returning here keeps this step from arming ACT over the next buy.
    if (skippedEmptyBook) {
      unwatch();
      return;
    }

    function onManualInput(event: Event) {
      // Synthetic events from changeInputValue() have isTrusted === false.
      if (event.isTrusted && !shouldUnwatch) {
        shouldUnwatch = true;
        log.info('检测到手动输入，保留输入的数量和价格');
      }
    }
    quantityInput.addEventListener('input', onManualInput);
    priceInput.addEventListener('input', onManualInput);

    const filled = fillAmount(cxTicker, amount, priceLimit);
    const buyPrice = resolveCxBuyPrice({
      allowUnfilled: data.allowUnfilled,
      priceLimit,
      filled,
    });
    const refinedValue = getPrice(ticker);
    const thresholds = userData.settings.noBuyThresholds;
    const level = priceExcessLevel(
      buyPrice,
      refinedValue,
      thresholds?.yellow ?? 10,
      thresholds?.red ?? 20,
    );
    if (level !== 'none' && buyPrice !== undefined && refinedValue !== undefined) {
      await new Promise<void>(resolve => {
        showTileOverlay(
          ctx.actTile.anchor,
          PriceThresholdWarning,
          {
            ticker,
            price: buyPrice,
            refinedValue,
            level,
          },
          // The overlay covers the ACT button. A backdrop click would let a player
          // spam-clicking ACT dismiss the warning without ever reading it, so the
          // only way out is DISMISS on the warning itself.
          { onClosed: resolve, dismissOnBackdrop: false },
        );
      });
    }
    await waitAct();
    quantityInput.removeEventListener('input', onManualInput);
    priceInput.removeEventListener('input', onManualInput);
    unwatch();

    const warehouseAmount = computed(() => {
      return (
        cxWarehouse.value?.items
          .map(x => x.quantity ?? undefined)
          .filter(x => x !== undefined)
          .find(x => x.material.ticker === ticker)?.amount ?? 0
      );
    });
    const currentAmount = warehouseAmount.value;
    const amountToFill = fillAmount(cxTicker, amount, priceLimit)?.amount ?? 0;
    const shouldWaitForUpdate = amountToFill > 0;

    await clickElement(buyButton);
    await waitActionFeedback(tile);

    if (shouldWaitForUpdate) {
      setStatus('正在等待库存更新……');
      await watchWhile(() => warehouseAmount.value === currentAmount);
    } else {
      setStatus('买单已创建');
    }

    complete();
  },
});
