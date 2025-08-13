// minimal shim for Phaser's XML parse types on modern TS
// Phaser's XML parser refers to ActiveXObject, which isn't defined in modern
// browser environments. Declare a loose global and type so TypeScript is
// satisfied.
type ActiveXObject = any;
declare const ActiveXObject: ActiveXObject;

