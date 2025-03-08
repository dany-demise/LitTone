// ActionManager.ts
export class ActionManager {
    private static _instance: ActionManager;
    // Stack to store actions as functions.
    private actionStack: Array<() => void> = [];
    // Timer ID for the interval
    private intervalId: number;
  
    // Private constructor to enforce singleton pattern.
    private constructor() {
      // Set interval to execute every 1/30 second (approximately 33ms)
      this.intervalId = window.setInterval(() => this.runTopAction(), 1000 / 30);
    }
  
    // Retrieve the singleton instance
    public static getInstance(): ActionManager {
      if (!this._instance) {
        this._instance = new ActionManager();
      }
      return this._instance;
    }
  
    /**
     * Push a new action onto the stack.
     * The action should encapsulate a call to generateTonemapHableFilmic.
     *
     * @param action A function that calls generateTonemapHableFilmic with its parameters.
     */
    public pushAction(action: () => void): void {
      this.actionStack.push(action);
    }
  
    /**
     * Called every 1/30 second.
     * Executes the most recent action on the stack (if any)
     * and clears the stack to discard any earlier actions.
     */
    private runTopAction(): void {
      if (this.actionStack.length === 0) {
        return;
      }
      // Get the top action (the most recent call)
      const topAction = this.actionStack[this.actionStack.length - 1];
      // Execute the action
      topAction();
      // Clear the entire stack, discarding earlier actions
      this.actionStack = [];
    }
  }
  