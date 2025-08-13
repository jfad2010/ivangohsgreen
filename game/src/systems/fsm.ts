export type State = {
  enter?: () => void;
  update?: (dt: number) => void;
  exit?: () => void;
};

export class FSM {
  private states: Record<string, State> = {};
  private current?: State;
  private currentName?: string;

  addState(name: string, state: State): this {
    this.states[name] = state;
    return this;
  }

  setState(name: string) {
    if (this.currentName === name) return;
    if (this.current && this.current.exit) this.current.exit();
    const state = this.states[name];
    if (!state) throw new Error(`State ${name} not found`);
    this.current = state;
    this.currentName = name;
    if (state.enter) state.enter();
  }

  update(dt: number) {
    if (this.current && this.current.update) {
      this.current.update(dt);
    }
  }

  get state() {
    return this.currentName;
  }
}
