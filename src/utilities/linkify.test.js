import { render } from '@testing-library/react';
import { renderMessage, findImageUrls } from './linkify';
import { getSecret } from './storage';
import { resolveImage } from './image';

const html = (text) => {
    const { container } = render(<div>{renderMessage(text)}</div>);
    return container;
};

test('links with and without https become anchors', () => {
    const links = [...html('see https://a.io/x, and fb.com plus www.google.com').querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://a.io/x', 'https://fb.com', 'https://www.google.com']);
    links.forEach((a) => expect(a.getAttribute('rel')).toContain('noopener'));
});

test('trailing punctuation stays outside the link', () => {
    const a = html('go to https://a.io/p.').querySelector('a');
    expect(a.textContent).toBe('https://a.io/p');
});

test('emails become mailto links, not websites', () => {
    const links = [...html('mail me a@b.com').querySelectorAll('a')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('mailto:a@b.com');
});

test('plain words and filenames are not linkified', () => {
    expect(html('hello.world file.js e.g. this').querySelectorAll('a')).toHaveLength(0);
});

test('script-like input is rendered as text, never as markup or javascript: links', () => {
    const c = html('<img src=x onerror=alert(1)> javascript:alert(1)');
    expect(c.querySelector('img')).toBeNull();
    expect(c.querySelectorAll('a')).toHaveLength(0);
});

test('"bhai" is highlighted and line breaks are kept', () => {
    const c = html('hi Bhai\nbye');
    expect(c.querySelector('.bhai-text').textContent).toBe('Bhai');
    expect(c.querySelector('br')).not.toBeNull();
});

test('numbered and bulleted lines become real lists', () => {
    const c = html('shopping:\n1. milk\n2. eggs\n- tea\n- coffee');
    expect([...c.querySelectorAll('ol li')].map((li) => li.textContent)).toEqual(['milk', 'eggs']);
    expect([...c.querySelectorAll('ul li')].map((li) => li.textContent)).toEqual(['tea', 'coffee']);
    expect(c.textContent).toContain('shopping:');
});

test('a list keeps its starting number and links work inside items', () => {
    const c = html('3. see fb.com\n4. done');
    expect(c.querySelector('ol').getAttribute('start')).toBe('3');
    expect(c.querySelector('ol li a').getAttribute('href')).toBe('https://fb.com');
});

test('normal text with a number or dash is not turned into a list', () => {
    expect(html('2024 was great - really').querySelectorAll('li')).toHaveLength(0);
    expect(html('1.5 litres').querySelectorAll('li')).toHaveLength(0);
});

test('bold, italic, strikethrough and inline code', () => {
    const c = html('**bold** and *italic* and _also italic_ and ~~gone~~ and `x < 1`');
    expect(c.querySelector('strong').textContent).toBe('bold');
    expect([...c.querySelectorAll('em')].map((e) => e.textContent)).toEqual(['italic', 'also italic']);
    expect(c.querySelector('del').textContent).toBe('gone');
    expect(c.querySelector('code').textContent).toBe('x < 1');
});

test('markdown inside code is left alone and links survive underscores', () => {
    expect(html('`**not bold**`').querySelector('strong')).toBeNull();
    const c = html('see https://a.com/foo_bar_baz and my_snake_case_name');
    expect(c.querySelector('a').getAttribute('href')).toBe('https://a.com/foo_bar_baz');
    expect(c.querySelector('em')).toBeNull();
});

test('links and bhai work inside bold; math like 2 * 3 * 4 is not italic', () => {
    const c = html('**visit fb.com bhai**');
    expect(c.querySelector('strong a').getAttribute('href')).toBe('https://fb.com');
    expect(c.querySelector('strong .bhai-text')).not.toBeNull();
    expect(html('2 * 3 * 4').querySelector('em')).toBeNull();
});

test('fenced code blocks keep their text and spacing', () => {
    const c = html('before\n```js\nconst a = 1;\n  **x**\n```\nafter');
    expect(c.querySelector('pre').textContent).toBe('const a = 1;\n  **x**');
    expect(c.querySelector('pre strong')).toBeNull();
    expect(c.textContent).toContain('before');
    expect(c.textContent).toContain('after');
});

test('styles combine on the same text', () => {
    let c = html('***both***');
    expect(c.querySelector('strong em').textContent).toBe('both');
    c = html('**bold with `code`**');
    expect(c.querySelector('strong code').textContent).toBe('code');
    c = html('*italic `code`*');
    expect(c.querySelector('em code')).not.toBeNull();
    c = html('**bold *and italic* inside**');
    expect(c.querySelector('strong em').textContent).toBe('and italic');
    c = html('***`all three`***');
    expect(c.querySelector('strong em code').textContent).toBe('all three');
});

test('findImageUrls only returns image links', () => {
    expect(findImageUrls('https://x.com/a.png?w=1 https://x.com/page img.com/b.gif')).toEqual(['https://x.com/a.png?w=1', 'https://img.com/b.gif']);
});

test('secret is created once, hex, and stable', () => {
    localStorage.clear();
    const s = getSecret();
    expect(s).toMatch(/^[a-f0-9]{64}$/);
    expect(getSecret()).toBe(s);
});

test('resolveImage prefixes server paths but keeps data urls', () => {
    expect(resolveImage('/api/images/1')).toMatch(/\/api\/images\/1$/);
    expect(resolveImage('/api/images/1')).not.toBe('/api/images/1');
    expect(resolveImage('data:image/png;base64,AA')).toBe('data:image/png;base64,AA');
});
