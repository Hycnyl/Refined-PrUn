import { localizeStorage } from '@src/infrastructure/i18n/labels';
import { act } from '@src/features/XIT/ACT/act-registry';
import { serializeStorage } from '@src/features/XIT/ACT/actions/utils';
import { fixed0 } from '@src/utils/format';
import { changeInputValue, clickElement } from '@src/util';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import { watchWhile } from '@src/utils/watch';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { AssertFn } from '@src/features/XIT/ACT/shared-types';
import { selectMaterial } from '@src/features/XIT/ACT/action-steps/cont-utils';
import { guardRouteStock } from '@src/features/XIT/ROUTE/route-stock-guard';

interface Data {
  from: string;
  to: string;
  ticker: string;
  amount: number;
  // Resolve the transfer amount from the MTRA slider max at execution time
  // instead of data.amount ("load everything available").
  loadAll?: boolean;
  // Reminder pause: prefill data.amount, then waitAct with actDelayMs 2000 so the
  // player adjusts the amount in the MTRA buffer before clicking the re-armed ACT.
  playerReview?: boolean;
}

export const MTRA_TRANSFER = act.addActionStep<Data>({
  type: 'MTRA_TRANSFER',
  preProcessData: data => ({ ...data, ticker: data.ticker.toUpperCase() }),
  totalMaterials: data => ({ [data.ticker]: data.amount }),
  description: data => {
    const from = storagesStore.getById(data.from);
    const to = storagesStore.getById(data.to);
    const fromName = from ? localizeStorage(serializeStorage(from)) : '未找到';
    const toName = to ? localizeStorage(serializeStorage(to)) : '未找到';
    if (data.loadAll) {
      return `转移全部 ${data.ticker}，从 ${fromName} 到 ${toName}`;
    }
    if (data.playerReview) {
      return `转移最多 ${fixed0(data.amount)} ${data.ticker}，从 ${fromName} 到 ${toName}（在 MTRA 中调整）`;
    }
    return `转移 ${fixed0(data.amount)} ${data.ticker}，从 ${fromName} 到 ${toName}`;
  },
  execute: async ctx => {
    const { data, log, setStatus, requestTile, waitAct, waitActionFeedback, complete, skip, fail } =
      ctx;
    const assert: AssertFn = ctx.assert;
    const { ticker, amount, loadAll, playerReview } = data;
    const from = storagesStore.getById(data.from);
    assert(from, '未找到来源库存');
    const to = storagesStore.getById(data.to);
    assert(to, '未找到目的地库存');

    if (!from.items.find(x => x.quantity?.material.ticker === ticker)) {
      log.warning(`没有 ${ticker} 已转移（来源中不存在）`);
      skip();
      return;
    }

    // Data.amount is only a snapshot estimate for loadAll totals/description.
    if (!loadAll && amount <= 0) {
      log.warning(`没有 ${ticker} 已转移（目标数量为 0）`);
      skip();
      return;
    }

    const material = materialsStore.getByTicker(ticker);
    assert(material, `未知材料 ${ticker}`);

    // Check if we can fit a single unit. MTRA will be unusable otherwise.
    const epsilon = 0.000001;
    const canFitWeight = to.weightCapacity - to.weightLoad - material.weight + epsilon >= 0;
    const canFitVolume = to.volumeCapacity - to.volumeLoad - material.volume + epsilon >= 0;
    if (!canFitWeight || !canFitVolume) {
      log.warning(`没有 ${ticker} 已转移（空间不足）`);
      skip();
      return;
    }

    const tile = await requestTile(
      `MTRA from-${from.id.substring(0, 8)} to-${to.id.substring(0, 8)}`,
    );
    if (!tile) {
      return;
    }

    setStatus('正在配置 MTRA 窗口……');
    const container = await $(tile.anchor, C.MaterialSelector.container);

    const ok = await selectMaterial(container, ticker);
    if (!ok) {
      fail(`材料代码 ${ticker}未在材料选择器中找到`);
      return;
    }

    const sliderNumbers = _$$(tile.anchor, 'rc-slider-mark-text').map(x =>
      Number(x.textContent ?? 0),
    );
    const maxAmount = Math.max(...sliderNumbers);
    const allInputs = _$$(tile.anchor, 'input');
    const amountInput = allInputs[1];
    assert(amountInput !== undefined, '未找到数量输入框');

    if (loadAll) {
      if (maxAmount === 0) {
        log.warning(`没有 ${ticker} 已转移（无可用数量）`);
        skip();
        return;
      }
      changeInputValue(amountInput, maxAmount.toString());
    } else {
      if (amount > maxAmount) {
        if (maxAmount === 0) {
          log.warning(`没有 ${ticker} 已转移（无可用数量）`);
          skip();
          return;
        }
        // The playerReview pause comes next - the player picks the final amount,
        // so a past-tense "transferred" claim here would be premature.
        if (!playerReview) {
          const leftover = amount - maxAmount;
          log.warning(
            `${fixed0(leftover)} ${ticker} 未转移 ` +
              `(${fixed0(maxAmount)}，目标 ${fixed0(amount)} 已转移）`,
          );
        }
      }
      changeInputValue(amountInput, Math.min(amount, maxAmount).toString());
    }

    const transferButton = await $(tile.anchor, C.Button.btn);

    // Taking from a CX warehouse below what its routes hold asks first.
    await guardRouteStock(ctx.actTile.anchor, from, { [ticker]: Number(amountInput.value) }, log);

    if (playerReview) {
      await waitAct(`调整 ${ticker} 的数量，在 MTRA 中设置后点击“执行下一步”（或跳过）`, {
        actDelayMs: 2000,
      });
      // Use whatever amount the player left in the input — do not rewrite it.
      const reviewed = Number(amountInput.value);
      if (!Number.isFinite(reviewed) || reviewed <= 0) {
        log.warning(`没有 ${ticker} 已转移（手动设置数量为 0）`);
        skip();
        return;
      }
    } else {
      await waitAct();
    }

    const destinationAmount = computed(() => {
      const store = storagesStore.getById(data.to);
      return (
        store?.items
          .map(x => x.quantity ?? undefined)
          .filter(x => x !== undefined)
          .find(x => x.material.ticker === ticker)?.amount ?? 0
      );
    });
    const currentAmount = destinationAmount.value;
    await clickElement(transferButton);
    await waitActionFeedback(tile);
    setStatus('Waiting for storage update...');
    await watchWhile(() => destinationAmount.value === currentAmount);

    complete();
  },
});
