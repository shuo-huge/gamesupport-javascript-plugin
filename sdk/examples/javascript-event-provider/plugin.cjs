// stdout is reserved for GS-IPC JSON. Use console.error() for logs.
const readline = require('node:readline');
const send = (message) => process.stdout.write(JSON.stringify(message) + '\n');
let initialized = false;
let running = false;
let canEmit = false;

// Replace this function with your own detection logic.
function emitPulse() {
  if (running && canEmit) {
    send({ type: 'event', event: 'example.pulse', data: { test: true } });
  }
}

send({
  type: 'hello',
  plugin_id: 'com.gamesupport.javascript-example',
  version: '1.0.0',
  protocol: 'gs-ipc/1.0',
});

readline
  .createInterface({ input: process.stdin, crlfDelay: Infinity })
  .on('line', (line) => {
    try {
      const message = JSON.parse(line);
      if (message.type === 'initialize') {
        if (initialized || message.protocol !== 'gs-ipc/1.0') throw Error('Invalid initialize');
        initialized = true;
        canEmit = Array.isArray(message.permissions) && message.permissions.includes('events.emit');
        // Your settings are available here: message.config
        send({ type: 'ready', request_id: message.request_id });
        return;
      }
      if (message.type !== 'command') return;
      switch (message.command) {
        case 'start':
          if (!initialized) throw Error('Initialize first');
          running = true;
          send({ type: 'status', state: 'running' });
          break;
        case 'ping':
          send({ type: 'pong', request_id: message.request_id });
          break;
        case 'configure':
          if (message.config?.emit_test === true) emitPulse();
          break;
        case 'stop':
          running = false;
          // Clear your timers / close connections here before exiting.
          process.stdout.write(JSON.stringify({ type: 'status', state: 'stopped' }) + '\n', () =>
            process.exit(0),
          );
          break;
      }
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  })
  .on('close', () => process.exit(0));
