import { ChallengeController } from './challenge-controller';

describe('ChallengeController', () => {
  it('initialises closed with initial state and not checking', () => {
    const ctrl = new ChallengeController('idle');
    expect(ctrl.show()).toBe(false);
    expect(ctrl.state()).toBe('idle');
    expect(ctrl.checking()).toBe(false);
  });

  it('open shows the modal and resets state to initial', () => {
    const ctrl = new ChallengeController('idle');
    ctrl.open();
    expect(ctrl.show()).toBe(true);
    expect(ctrl.state()).toBe('idle');
  });

  it('open resets checking flag', () => {
    const ctrl = new ChallengeController('idle');
    ctrl.open();
    expect(ctrl.checking()).toBe(false);
  });

  it('close hides the modal', () => {
    const ctrl = new ChallengeController('idle');
    ctrl.open();
    ctrl.close();
    expect(ctrl.show()).toBe(false);
  });

  it('restart resets state and checking without touching show', () => {
    const ctrl = new ChallengeController<'idle' | 'correct'>('idle');
    ctrl.open();
    ctrl.state.set('correct');
    ctrl.restart();
    expect(ctrl.show()).toBe(true);
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
