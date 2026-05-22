import { ChallengeController } from './challenge-controller';

describe('ChallengeController', () => {
  it('initialises with initial state and not checking', () => {
    const ctrl = new ChallengeController('idle');
    expect(ctrl.state()).toBe('idle');
    expect(ctrl.checking()).toBe(false);
  });

  it('restart resets state and checking', () => {
    const ctrl = new ChallengeController<'idle' | 'correct'>('idle');
    ctrl.state.set('correct');
    ctrl.restart();
    expect(ctrl.state()).toBe('idle');
    expect(ctrl.checking()).toBe(false);
  });

  it('check sets checking during execution and clears it on completion', async () => {
    const ctrl = new ChallengeController('idle');
    let checkingDuring = false;

    await ctrl.check(async () => {
      checkingDuring = ctrl.checking();
    });

    expect(checkingDuring).toBe(true);
    expect(ctrl.checking()).toBe(false);
  });

  it('check clears checking even when the callback throws', async () => {
    const ctrl = new ChallengeController('idle');

    await ctrl
      .check(async () => {
        throw new Error('boom');
      })
      .catch(() => undefined);

    expect(ctrl.checking()).toBe(false);
  });
});
