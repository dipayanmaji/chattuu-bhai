import { applyFormat } from './format';
import { renderMessage } from './linkify';
import { render } from '@testing-library/react';

// simulate pressing the buttons one after another while the word stays selected
const press = (value, start, end, ...markers) => {
    let state = { text: value, selStart: start, selEnd: end };
    markers.forEach((m) => { state = applyFormat(state.text, state.selStart, state.selEnd, m); });
    return state;
};
const word = (text) => ({ start: text.indexOf('nicee'), end: text.indexOf('nicee') + 5 });
const html = (text) => render(<div>{renderMessage(text)}</div>).container;

test('wraps the selection, keeps it selected, and a second press removes it', () => {
    const { start, end } = word('hi nicee');
    const on = press('hi nicee', start, end, '**');
    expect(on.text).toBe('hi **nicee**');
    expect(on.text.slice(on.selStart, on.selEnd)).toBe('nicee');
    expect(press('hi nicee', start, end, '**', '**').text).toBe('hi nicee');
});

test('no selection inserts an empty pair with the cursor between the markers', () => {
    const r = applyFormat('ab', 1, 1, '`');
    expect(r.text).toBe('a``b');
    expect([r.selStart, r.selEnd]).toEqual([2, 2]);
});

test.each([
    [['**', '*'], '***nicee***', 'strong em'],
    [['*', '**'], '***nicee***', 'strong em'],
    [['**', '`'], '**`nicee`**', 'strong code'],
    [['`', '**'], '**`nicee`**', 'strong code'],
    [['`', '*'], '*`nicee`*', 'em code'],
    [['**', '*', '`'], '***`nicee`***', 'strong em code'],
    [['`', '*', '**'], '***`nicee`***', 'strong em code']
])('pressing %j gives %s and renders as <%s>', (markers, expected, selector) => {
    const { start, end } = word('nicee');
    expect(press('nicee', start, end, ...markers).text).toBe(expected);
    expect(html(expected).querySelector(selector).textContent).toBe('nicee');
});

test('each style can be removed again without breaking the others', () => {
    const { start, end } = word('nicee');
    const all = press('nicee', start, end, '**', '*', '`');
    expect(applyFormat(all.text, all.selStart, all.selEnd, '*').text).toBe('**`nicee`**');
    expect(applyFormat(all.text, all.selStart, all.selEnd, '**').text).toBe('*`nicee`*');
    expect(applyFormat(all.text, all.selStart, all.selEnd, '`').text).toBe('***nicee***');
});

test('selecting already formatted text removes the markers', () => {
    expect(applyFormat('**nicee**', 0, 9, '**').text).toBe('nicee');
    expect(applyFormat('`nicee`', 0, 7, '`').text).toBe('nicee');
});
