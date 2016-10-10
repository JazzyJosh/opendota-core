const db = require('../db');
const async = require('async');
const JSONStream = require('JSONStream');
const args = process.argv.slice(2);
const start_id = Number(args[0]) || 0;
// var end_id = Number(args[1]) || Number.MAX_VALUE;
// ALTER TABLE matches ADD COLUMN pgroup json;
const stream = db.select('match_id').from('matches').where('match_id', '>=', start_id).whereNull('pgroup').orderBy('match_id', 'asc').stream();
stream.on('end', done);
stream.pipe(JSONStream.parse());

function done(err) {
  if (err) {
    console.error(err);
  }
  process.exit(Number(err));
}
stream.on('data', (m) => {
  stream.pause();
  db.select(['account_id', 'hero_id', 'player_slot']).from('player_matches').where({
    match_id: m.match_id,
  }).asCallback((err, pms) => {
    if (err) {
      return done(err);
    }
    const pgroup = {};
    pms.forEach((p) => {
      pgroup[p.player_slot] = p;
    });
    console.log(m.match_id);
    db('matches').update({
      pgroup,
    }).where({
      match_id: m.match_id,
    }).asCallback(cb);
  });

  function cb(err) {
    if (err) {
      return done(err);
    }
    stream.resume();
  }
});
