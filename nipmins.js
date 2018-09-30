#! /usr/bin/env node

// Run npm install (only Linux or Mac currently) while linking globally installed modules and without bugging

const fs = require('fs');
var installedModules;

async function plan() {
  await rune.call({silent: true}, 'mv', './package-backup.json', './package.json');

  const pj = require('./package.json');

  installedModules = fs.readdirSync('/usr/local/lib/node_modules');

  var pre = cloneDeep(pj);

  await rune('mkdir', './node_modules');

  for (var mod in pj.dependencies) await fix(pj.dependencies, mod);
  for (var mod in pj.devDependencies) await fix(pj.devDependencies, mod);

  await rune('mv', './package.json', './package-backup.json');
  fs.writeFileSync('./package.json', JSON.stringify(pj));

  await rune('npm', 'i');
  await rune('mv', './package-backup.json', './package.json');

}

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

async function fix(object, item) {
  if (installedModules.indexOf(item) > -1) {
    var beforeReplacement = object[item]; // unneeded
    delete object[item];

    await rune('rm', '-rf', './node_modules/' + item);
    await rune('ln', '-s', '/usr/local/lib/node_modules/' + item, 'node_modules/');
  }
}

async function rune() {
  var params = {stdio: [process.stdin, process.stdout, process.stderr]};
  if (this.silent) params = {};
  var rv = require('child_process').spawnSync(arguments[0], Array.prototype.slice.call(arguments, 1), params);
}

async function cleanExit() {
  await rune('mv', './package-backup.json', './package.json');
  process.exit();
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

plan().then(() => {
  console.log('nipmins: done');
});
