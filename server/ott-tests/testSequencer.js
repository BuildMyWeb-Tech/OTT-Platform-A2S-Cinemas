const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    return tests.sort((a, b) => {
      const order = [
        '01-auth', '02-categories', '03-movies',
        '04-payment', '05-license', '06-purchases',
        '07-stream', '08-admin'
      ];
      const aIdx = order.findIndex(o => a.path.includes(o));
      const bIdx = order.findIndex(o => b.path.includes(o));
      return aIdx - bIdx;
    });
  }
}

module.exports = CustomSequencer;