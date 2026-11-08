'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'docs', 'styles.css'), 'utf8');

test('has essential document metadata and landmarks', () => {
  for (const part of ['<!doctype html>', '<html lang="en">', '<meta name="viewport"', '<meta name="description"', '<title>', '<main id="main">', '</main>', '</html>']) {
    assert.ok(html.includes(part), 'Missing: ' + part);
  }
  assert.match(html, /<h1\s+id="hero-title">/);
});

test('all internal anchor targets exist', () => {
  const idSet = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]));
  const anchors = [...html.matchAll(/\bhref="#([^"]+)"/g)].map(x => x[1]);
  assert.ok(anchors.length >= 6);
  for (const anchor of anchors) assert.ok(idSet.has(anchor), 'Missing target for #' + anchor);
});

test('external links use https and safe new-tab attributes', () => {
  const links = [...html.matchAll(/<a\b[^>]*\bhref="(https?:[^"]+)"[^>]*>/g)];
  assert.ok(links.length >= 10);
  for (const [tag, url] of links) {
    assert.ok(url.startsWith('https://'), 'Non-HTTPS: ' + url);
    assert.match(tag, /target="_blank"/);
    assert.match(tag, /rel="noopener noreferrer"/);
  }
});

test('images have useful alt text, dimensions, and lazy loading', () => {
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(x => x[0]);
  assert.ok(images.length >= 1);
  for (const tag of images) {
    assert.match(tag, /\balt="[^"]+"/);
    assert.match(tag, /\bwidth="\d+"/);
    assert.match(tag, /\bheight="\d+"/);
    assert.match(tag, /\bloading="lazy"/);
  }
});

test('styles use responsive breakpoints and respect reduced motion', () => {
  assert.match(html, /href="styles.css"/);
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /:focus-visible/);
});

test('contact points to public issue form and warns about privacy', () => {
  assert.match(html, /issues\/new\?template=project-inquiry\.yml/);
  assert.match(html, /GitHub Issues are public/);
  assert.match(html, /confidential information/);
});
