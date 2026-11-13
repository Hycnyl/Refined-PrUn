import {
  changeSelectIndex,
  changeTextAreaValue,
  clickElement,
  focusElement,
  selectAndChangeInputValue,
  selectMaterialInMaterialSelector,
} from '@src/util';
import { sleep } from '@src/utils/sleep';
import { fixed0 } from '@src/utils/format';
import { contractDraftsStore } from '@src/infrastructure/prun-api/data/contract-drafts';
import { ActionStepExecuteContext, AssertFn } from '@src/features/XIT/ACT/shared-types';
import { maxContractDays, minContractDays } from '@src/features/XIT/ACT/actions/cont-limits';

// The game's own form limits. Generated text is truncated to fit rather than
// silently rejected by the field.
const maxNameLength = 50;
const maxPreambleLength = 250;

// Polls until the callback returns something truthy, then hands that value back.
// Returning the value avoids the find-twice pattern a boolean version forces.
export async function pollUntil<T>(
  produce: () => T,
  timeout: number,
  interval = 100,
): Promise<T | undefined> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const result = produce();
    if (result) {
      return result;
    }
    if (Date.now() >= deadline) {
      return undefined;
    }
    await sleep(interval);
  }
}

const isText = (text: string | undefined) => (x: Element) =>
  text !== undefined && x.textContent?.trim().toLowerCase() === text.trim().toLowerCase();

function findButton(anchor: Element, text: string | undefined) {
  return _$$(anchor, C.Button.btn).find(isText(text));
}

function truncate(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

/**
 * Types a ticker into a MaterialSelector and clicks the matching suggestion.
 * Also used by MTRA_TRANSFER and the ship-unload feature. Delegates to the
 * shared helper, which checks the updated client's #autosuggest-portal first,
 * then the older in-selector list, and gives up after 3s.
 */
export async function selectMaterial(container: Element, ticker: string) {
  const selected = await selectMaterialInMaterialSelector(container, ticker);
  if (selected) {
    await sleep(200);
  }
  return selected;
}

/**
 * Finds the "Create New" button in any CONTD tile, clicks it, and waits for the
 * new draft to appear in the store.
 */
export async function createNewDraft(ctx: ActionStepExecuteContext<unknown>) {
  const assert: AssertFn = ctx.assert;
  const { log, setStatus } = ctx;

  setStatus('正在查找新建按钮……');

  const findCreateButton = () => {
    for (const tile of tiles.find('CONTD', true)) {
      const button = findButton(tile.anchor, L.ContractDrafts.actions.create());
      if (button) {
        return button;
      }
    }
    return undefined;
  };

  const createBtn = await pollUntil(findCreateButton, 10000);
  assert(createBtn, '未找到新建按钮');

  const beforeIds = new Set((contractDraftsStore.all.value ?? []).map(x => x.naturalId));
  await clickElement(createBtn);

  setStatus('正在等待创建草稿……');
  const newDraft = await pollUntil(
    () => (contractDraftsStore.all.value ?? []).find(x => !beforeIds.has(x.naturalId)),
    8000,
  );
  assert(newDraft, '等待新合同草稿超时');
  log.info(`已创建新草稿：${newDraft.naturalId}`);
  return newDraft;
}

/**
 * Sets the contract name (first input) and preamble (textarea) in the draft tile.
 */
export async function setDraftNameAndPreamble(
  ctx: ActionStepExecuteContext<unknown>,
  anchor: Element,
  name: string,
  preamble: string,
) {
  const assert: AssertFn = ctx.assert;
  const { log, setStatus } = ctx;

  setStatus('正在设置合同名称……');

  // Poll rather than `await $()`, which has no timeout and would hang the run
  // instead of failing it when the form never renders.
  const nameInput = await pollUntil(() => _$(anchor, 'input'), 5000);
  assert(nameInput, '未找到名称输入框');
  selectAndChangeInputValue(nameInput, truncate(name, maxNameLength));
  log.info(`已设置名称：${name}`);

  const preambleInput = _$(anchor, 'textarea');
  assert(preambleInput, '未找到前言输入框');
  focusElement(preambleInput);
  changeTextAreaValue(preambleInput, truncate(preamble, maxPreambleLength));
  log.info('已设置前言');
}

/**
 * Clicks the draft-details save button and waits for the server to echo the
 * saved name and preamble back into the store.
 */
export async function saveDraftDetails(
  ctx: ActionStepExecuteContext<unknown>,
  anchor: Element,
  draftId: string,
) {
  const assert: AssertFn = ctx.assert;
  const { log, setStatus } = ctx;

  setStatus('正在保存草稿详情……');

  const before = contractDraftsStore.getByNaturalId(draftId);
  // Read back what the form holds rather than what we meant to write, so a
  // field the game reformatted still compares equal.
  const name = _$(anchor, 'input')?.value;
  const preamble = _$(anchor, 'textarea')?.value;
  const saveBtn = findButton(anchor, L.ContractDraft.action.save());
  assert(
    saveBtn !== undefined && !saveBtn.classList.contains(C.Button.disabled),
    '草稿详情保存按钮缺失或已禁用',
  );
  await clickElement(saveBtn);

  const saved = await pollUntil(() => {
    const draft = contractDraftsStore.getByNaturalId(draftId);
    return (
      draft !== undefined && draft !== before && draft.name === name && draft.preamble === preamble
    );
  }, 8000);
  assert(saved, '草稿详情未保存');
  log.info('草稿详情已保存');
}

/**
 * Clicks "Select Template" and returns the template type <select>.
 */
export async function openTemplate(ctx: ActionStepExecuteContext<unknown>, anchor: Element) {
  const assert: AssertFn = ctx.assert;
  const { setStatus } = ctx;

  setStatus('正在打开模板选择……');

  const templateBtn = await pollUntil(
    () => findButton(anchor, L.ContractDraft.action.template()),
    5000,
  );
  assert(templateBtn, '未找到选择模板按钮');
  await clickElement(templateBtn);

  const templateSelect = await pollUntil(() => {
    const container = _$(anchor, C.TemplateSelection.templateTypeSelect);
    return container === undefined ? undefined : _$(container, 'select');
  }, 5000);
  assert(templateSelect, '未找到模板类型选择框');
  return templateSelect;
}

// Map stored action values to the game's <select> option values.
const templateValueMap: Record<string, string> = {
  BUYING: 'BUY',
  SELLING: 'SELL',
};

/**
 * Selects a template type (e.g. 'SHIP', 'BUYING', 'SELLING') in the template dropdown.
 */
export function selectTemplateType(
  ctx: ActionStepExecuteContext<unknown>,
  templateSelect: HTMLSelectElement,
  templateValue: string,
) {
  const assert: AssertFn = ctx.assert;
  const mapped = templateValueMap[templateValue] ?? templateValue;
  const index = Array.from(templateSelect.options).findIndex(x => x.value === mapped);
  assert(index >= 0, `模板“${templateValue}”未在模板选择框中找到`);
  changeSelectIndex(templateSelect, index);
  ctx.log.info(`已选择“${templateValue}”模板`);
}

/**
 * Finds the currency <select> and sets it to the given currency code.
 */
export async function setCurrency(
  ctx: ActionStepExecuteContext<unknown>,
  anchor: Element,
  currency: string,
) {
  const assert: AssertFn = ctx.assert;
  const { log } = ctx;

  const currencySelect = await pollUntil(
    () => _$$(anchor, 'select').find(x => Array.from(x.options).some(o => o.value === currency)),
    3000,
  );
  assert(currencySelect, `未找到货币选择框：${currency}`);
  const index = Array.from(currencySelect.options).findIndex(x => x.value === currency);
  changeSelectIndex(currencySelect, index);
  log.info(`已设置货币为 ${currency}`);
}

export interface MaterialEntry {
  ticker: string;
  amount: number;
}

export interface AddMaterialsOptions {
  /** Called after each material row is set up, with the group element and ticker. */
  setPrice?: (group: Element, ticker: string) => void;
}

/**
 * Adds material rows to the contract template. Clicks "Add shipment"/"Add commodity"
 * for rows after the first, sets amount and selects material for each.
 *
 * Same job as importMaterials() in src/features/basic/contd-paste-import/draft-form.ts
 * (the CONTD paste-import feature), kept separate since this one drives an ACT step.
 */
export async function addMaterials(
  ctx: ActionStepExecuteContext<unknown>,
  anchor: Element,
  materials: MaterialEntry[],
  options?: AddMaterialsOptions,
) {
  const assert: AssertFn = ctx.assert;
  const { log, setStatus } = ctx;

  setStatus('正在向模板添加材料……');

  const findAddButton = () =>
    _$$(anchor, 'button').find(
      x =>
        isText(L.TemplateSelection.action.addShipment())(x) ||
        isText(L.TemplateSelection.action.addCommodity())(x),
    );

  for (let i = 0; i < materials.length; i++) {
    const material = materials[i];

    if (i > 0) {
      const addBtn = findAddButton();
      assert(addBtn, `未找到添加按钮：${material.ticker}`);
      await clickElement(addBtn);
    }

    // Index the row rather than taking the last one: the template may render
    // rows we did not add, and every entry would then overwrite the same row.
    const group = await pollUntil(() => _$$(anchor, C.TemplateSelection.group).at(i), 2000);
    assert(group, `未找到分组：${material.ticker}`);

    const amountInput = group.querySelector<HTMLInputElement>('input[inputmode="numeric"]');
    assert(amountInput, `未找到数量输入框：${material.ticker}`);
    selectAndChangeInputValue(amountInput, String(material.amount));

    const matSelector = _$(group, C.MaterialSelector.container);
    assert(matSelector, `未找到材料选择器：${material.ticker}`);
    const selected = await selectMaterial(matSelector, material.ticker);
    assert(selected, `无法选择材料 ${material.ticker}`);
    log.info(`已添加：${material.ticker} x${fixed0(material.amount)}`);

    options?.setPrice?.(group, material.ticker);
  }
}

/**
 * Sets the deadline (days to fulfill) input.
 */
export function setDeadline(ctx: ActionStepExecuteContext<unknown>, anchor: Element, days: number) {
  const assert: AssertFn = ctx.assert;
  const { log } = ctx;

  assert(
    Number.isInteger(days) && days >= minContractDays && days <= maxContractDays,
    `截止期限必须介于 ${minContractDays} 到 ${maxContractDays} 天`,
  );

  const deadlineInput = anchor.querySelector<HTMLInputElement>('input[name="deadline"]');
  assert(deadlineInput, '未找到截止期限输入框');
  selectAndChangeInputValue(deadlineInput, String(days));
  log.info(`已设置截止期限：${fixed0(days)} 天`);
}

/**
 * Clicks "Apply Template" and waits for the server to rewrite the draft's
 * conditions. The button's disabled class flickers on any re-render, so it is
 * not evidence that the template was accepted.
 */
export async function applyTemplate(
  ctx: ActionStepExecuteContext<unknown>,
  anchor: Element,
  draftId: string,
) {
  const assert: AssertFn = ctx.assert;
  const { log, setStatus } = ctx;

  setStatus('正在应用模板……');

  const applyBtn = await pollUntil(
    () => findButton(anchor, L.TemplateSelection.action.template()),
    5000,
  );
  assert(applyBtn, '未找到应用模板按钮');
  assert(!applyBtn.classList.contains(C.Button.disabled), '模板表单无效');

  const before = contractDraftsStore.getByNaturalId(draftId);
  await clickElement(applyBtn);

  const applied = await pollUntil(() => {
    const draft = contractDraftsStore.getByNaturalId(draftId);
    return draft !== undefined && draft !== before && draft.conditions.length > 0;
  }, 8000);
  assert(applied, '未收到模板条件');
  log.info('模板已应用');
}

/**
 * Clicks the conditions save button and waits for the draft to come back valid.
 */
export async function saveConditions(
  ctx: ActionStepExecuteContext<unknown>,
  anchor: Element,
  draftId: string,
) {
  const assert: AssertFn = ctx.assert;
  const { log, setStatus } = ctx;

  setStatus('正在保存条件……');

  const before = contractDraftsStore.getByNaturalId(draftId);
  const condSaveBtn = _$$(anchor, C.Button.btn).findLast(isText(L.ContractDraftSend.action.save()));
  assert(
    condSaveBtn !== undefined && !condSaveBtn.classList.contains(C.Button.disabled),
    '条件保存按钮缺失或已禁用',
  );
  await clickElement(condSaveBtn);

  const saved = await pollUntil(() => {
    const draft = contractDraftsStore.getByNaturalId(draftId);
    return (
      draft !== undefined &&
      draft !== before &&
      draft.status === 'VALID' &&
      draft.conditions.length > 0
    );
  }, 8000);
  assert(saved, '合同条件未保存');
  log.info('条件已保存');
}
