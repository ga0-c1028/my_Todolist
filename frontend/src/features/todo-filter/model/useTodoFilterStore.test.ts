import { beforeEach, describe, expect, it } from 'vitest';
import { useTodoFilterStore } from './useTodoFilterStore';

describe('useTodoFilterStore', () => {
  beforeEach(() => {
    useTodoFilterStore.getState().reset();
  });

  it('has undefined categoryId and status initially', () => {
    const state = useTodoFilterStore.getState();
    expect(state.categoryId).toBeUndefined();
    expect(state.status).toBeUndefined();
  });

  it('setCategoryId updates categoryId, and undefined clears it', () => {
    useTodoFilterStore.getState().setCategoryId('c1');
    expect(useTodoFilterStore.getState().categoryId).toBe('c1');

    useTodoFilterStore.getState().setCategoryId(undefined);
    expect(useTodoFilterStore.getState().categoryId).toBeUndefined();
  });

  it('setStatus updates status', () => {
    useTodoFilterStore.getState().setStatus('inProgress');
    expect(useTodoFilterStore.getState().status).toBe('inProgress');
  });

  it('reset clears categoryId and status back to undefined', () => {
    useTodoFilterStore.getState().setCategoryId('c1');
    useTodoFilterStore.getState().setStatus('completed');

    useTodoFilterStore.getState().reset();

    const state = useTodoFilterStore.getState();
    expect(state.categoryId).toBeUndefined();
    expect(state.status).toBeUndefined();
  });
});
