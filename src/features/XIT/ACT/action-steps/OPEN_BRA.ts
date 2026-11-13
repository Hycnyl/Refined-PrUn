import { act } from '@src/features/XIT/ACT/act-registry';
import { getPlanetName } from '@src/core/planet-name';

interface Data {
  planet: string;
}

export const OPEN_BRA = act.addActionStep<Data>({
  type: 'OPEN_BRA',
  description: data => `打开 BRA ${getPlanetName(data.planet)} 以维修基地`,
  execute: async ctx => {
    const { data, waitAct, requestTile, complete } = ctx;
    const tile = await requestTile(`BRA ${data.planet}`);
    if (!tile) {
      return;
    }
    // Reminder pause: keep ACT grayed so the player runs the repair first.
    await waitAct(`维修基地建筑：${getPlanetName(data.planet)}，然后继续`, {
      actDelayMs: 2000,
    });
    complete();
  },
});
