import { act } from '@src/features/XIT/ACT/act-registry';
import { buildAgentPackageMessage } from '@src/features/XIT/ACT/agent-sync';
import { postAgentMessage } from '@src/infrastructure/prun-ui/agent-channel-messaging';

interface Data {
  pkg: UserData.ActionPackageData;
  // Pre-allocated id (e.g. chain member "c11-2"); omit to auto-generate.
  id?: string;
}

const maxPostAttempts = 3;
// Chained runs post several packages to the same chat channel back-to-back, which can trip
// the game's flood protection. The gap belongs *between* posts, so it grays ACT ahead of
// every post except the run's first — that one has nothing to be spaced from, and pausing
// before it just makes the player wait. Nothing pauses after the last post either. Retries
// always keep the gap; they are what actually recovers, since the throttle window isn't
// something a fixed delay can outwait.
const postGapMs = 2000;

export const POST_AGENT = act.addActionStep<Data>({
  type: 'POST_AGENT',
  description: data => `发送 [${data.pkg.global.name}] 动作包到同步频道`,
  execute: async ctx => {
    const { data, isFirstOfType, waitAct, complete, skip, log } = ctx;
    const { id, text } = await buildAgentPackageMessage(data.pkg, data.id);
    const name = data.pkg.global.name ?? 'package';
    for (let attempt = 1; attempt <= maxPostAttempts; attempt++) {
      const isRunFirstPost = isFirstOfType && attempt === 1;
      await waitAct(attempt === 1 ? undefined : `重试发送 [${name}]，编号 [${id}]`, {
        actDelayMs: isRunFirstPost ? 0 : postGapMs,
      });
      try {
        await postAgentMessage(text);
        log.info(`已发送动作包，编号 [${id}]`);
        complete();
        return;
      } catch (e) {
        log.error(
          `发送失败 [${name}]，编号 [${id}]: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
    log.error('已停止重试，请手动将此动作包发送到 refined-agent 频道：');
    log.label(text);
    skip({ silent: true });
  },
});
