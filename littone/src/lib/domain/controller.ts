// Singleton controller class
export class Controller {
    private static _instance: Controller; // Singleton instance
    private constructor() { } // Constructeur privee

    // Attributs 
    globalStore: Map<string, Function> = new Map(); // global store de fonctions 
    public static getInstance() { // Instance getter for Singleton pattern implementation
        if (this._instance) { return this._instance; }
        else { this._instance = new this(); return this._instance; }
    }
}