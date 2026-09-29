// Unit checks for catalog content and dialog events without a browser runtime.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.events = {}; this.attributes = {}; this.classes = new Set(); this.classList = {add: name => this.classes.add(name), remove: name => this.classes.delete(name)}; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, callback) { this.events[name] = callback; }
  querySelector(selector) { return this.nodes[selector]; }
  set innerHTML(value) {
    assert.equal(this.tag, 'dialog');
    this.nodes = Object.fromEntries(['h2', 'img', '.service-description', '.service-quote', '.service-dialog-body', '.service-close'].map(key => [key, new Element(key)]));
  }
  showModal() { this.open = true; }
  close() { this.open = false; this.events.close(); }
  focus() { this.focused = true; }
  getBoundingClientRect() { return {left:100, right:800, top:100, bottom:600}; }
}

const grid = new Element('section');
const document = {body:new Element('body'), createElement: tag => new Element(tag), querySelectorAll: () => [grid]};
const context = {document, window:{}, location:{origin:'https://rpa.example'}, URL};
vm.runInNewContext(fs.readFileSync('public/assets/js/services-data.js','utf8'), context);
vm.runInNewContext(fs.readFileSync('public/assets/js/servicos.js','utf8'), context);
const services = context.window.RPAServices;
assert.equal(services.length, 9);
assert.equal(new Set(services.map(service => service.id)).size, 9);
assert.equal(grid.children.length, 9);
const dialog = document.body.children[0];
for (const [index, service] of services.entries()) {
  assert(fs.existsSync('public' + service.image));
  assert(service.sections.some(section => section.text || section.items?.length));
  const card = grid.children[index];
  assert.equal(card.children.length, 2, 'Cards show only the photo and title');
  assert.equal(card.attributes['aria-haspopup'], 'dialog');
  card.events.click();
  assert.equal(dialog.open, true);
  assert.equal(dialog.nodes.h2.textContent, service.title);
  assert.equal(dialog.nodes.img.src, service.image);
  assert(document.body.classes.has('service-modal-open'));
  const quote = new URL(dialog.nodes['.service-quote'].href);
  assert.equal(quote.hostname, 'wa.me');
  assert(quote.searchParams.get('text').includes(service.title));
  const expected = service.sections.reduce((total, section) => total + Boolean(section.heading) + Boolean(section.text) + Boolean(section.items), 0);
  assert.equal(dialog.nodes['.service-description'].children.length, expected, 'Previous service text must be cleared');
  dialog.nodes['.service-close'].events.click();
  assert.equal(dialog.open, false);
  assert.equal(document.body.classes.has('service-modal-open'), false);
  assert(card.focused, 'Focus returns to the card');
}
grid.children[0].events.click();
dialog.events.click({target:dialog, clientX:200, clientY:200});
assert(dialog.open, 'Clicking dialog padding must not close it');
dialog.events.click({target:dialog, clientX:20, clientY:20});
assert.equal(dialog.open, false, 'Clicking outside closes the dialog');
assert.equal(services.find(service => service.id === 'transformacao-freio').sections[0].text, 'Transformação de freio a óleo para freio a ar.');
assert(!fs.existsSync('public/produtos.html'));
assert(!fs.readFileSync('public/assets/js/navigation.js','utf8').includes('produtos.html'));
for (const filename of fs.readdirSync('public').filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync('public/' + filename,'utf8');
  for (const [,url] of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) assert(fs.existsSync('public' + url.split('?')[0]), url);
}
console.log('OK: 9 services, images and descriptions; dialog content, close, backdrop and focus; links and removed products page.');
