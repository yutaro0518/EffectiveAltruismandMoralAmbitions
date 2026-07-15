#!/usr/bin/env node
// data/orgs.js の採点データを検査する。
//   node scripts/validate.js
// エラーがあれば団体idとともに出力し、exit(1) で落とす。

'use strict';

const path = require('path');
const orgsPath = path.join(__dirname, '..', 'data', 'orgs.js');

// orgs.js はブラウザ向けに window.ORGS へ代入する。Node では window が
// 無いので空オブジェクトを用意してから読み込む。
global.window = {};
require(orgsPath);

const orgs = global.window.ORGS;
const errors = [];

const isScoreTriple = (a) =>
  Array.isArray(a) &&
  a.length === 3 &&
  a.every((n) => Number.isInteger(n) && n >= 0 && n <= 4);

if (!Array.isArray(orgs)) {
  console.error('window.ORGS が配列ではありません。');
  process.exit(1);
}

const seenIds = new Map();

orgs.forEach((o, i) => {
  const id = o && o.id ? o.id : `#${i}（idなし）`;
  const err = (msg) => errors.push(`${id}: ${msg}`);

  if (!o.id) err('id が未設定です。');

  // q / l はそれぞれ 0〜4 の整数を3つ持つ配列
  if (!isScoreTriple(o.q)) err('q は 0〜4 の整数3つの配列である必要があります。');
  if (!isScoreTriple(o.l)) err('l は 0〜4 の整数3つの配列である必要があります。');

  // 根拠文はそれぞれ長さ3
  if (!Array.isArray(o.qr) || o.qr.length !== 3) err('qr は長さ3の配列である必要があります。');
  if (!Array.isArray(o.lr) || o.lr.length !== 3) err('lr は長さ3の配列である必要があります。');

  // sources は任意だが、要素があれば url と retrieved が必須
  if (o.sources != null) {
    if (!Array.isArray(o.sources)) {
      err('sources は配列である必要があります。');
    } else {
      o.sources.forEach((s, j) => {
        if (!s || !s.url) err(`sources[${j}] に url がありません。`);
        if (!s || !s.retrieved) err(`sources[${j}] に retrieved がありません。`);
      });
    }
  }

  // id の重複チェック
  if (o.id) {
    if (seenIds.has(o.id)) {
      errors.push(`${o.id}: id が重複しています（index ${seenIds.get(o.id)} と ${i}）。`);
    } else {
      seenIds.set(o.id, i);
    }
  }
});

if (errors.length) {
  console.error(`検証エラー ${errors.length} 件:`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

console.log(`OK: ${orgs.length} 団体、エラーなし。`);
