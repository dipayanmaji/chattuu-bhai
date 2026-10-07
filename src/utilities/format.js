// number of consecutive "*" starting at `from` and walking by `step`
const starRun = (value, from, step) => {
    let n = 0;
    while (value[from + step * n] === '*') n++;
    return n;
};

// Wrap the selection [start, end) of `value` in a markdown marker (or insert an empty pair);
// applying the same marker again removes it. Styles combine on the same text:
// ***bold italic***, **`bold code`**, *`italic code`*.
// Returns { text, selStart, selEnd }.
export const applyFormat = (value, start, end, marker) => {
    const m = marker.length;

    // keep code innermost, markers go around it: **`x`** (a style inside backticks would show literally)
    if (marker !== '`' && value[start - 1] === '`' && value[end] === '`' && !value.slice(start, end).includes('`')) {
        start--;
        end++;
    }
    const selected = value.slice(start, end);

    let unwrap = null; // 'outside' | 'inside' | null
    if (marker === '`') {
        if (value[start - 1] === '`' && value[end] === '`') unwrap = 'outside';
        else if (selected.length >= 2 && selected.startsWith('`') && selected.endsWith('`')) unwrap = 'inside';
    } else {
        // 1 star = italic, 2 = bold, 3 = both
        const around = Math.min(starRun(value, start - 1, -1), starRun(value, end, 1), 3);
        const active = marker === '**' ? around >= 2 : around === 1 || around === 3;
        if (active) unwrap = 'outside';
        else if (selected.length >= 2 * m + 1 && selected.startsWith(marker) && selected.endsWith(marker)
            && (marker === '**' || (!selected.startsWith('**') && !selected.endsWith('**')))) unwrap = 'inside';
    }

    if (unwrap === 'outside') {
        return {
            text: value.slice(0, start - m) + selected + value.slice(end + m),
            selStart: start - m,
            selEnd: end - m
        };
    }
    if (unwrap === 'inside') {
        const inner = selected.slice(m, selected.length - m);
        return { text: value.slice(0, start) + inner + value.slice(end), selStart: start, selEnd: start + inner.length };
    }
    return {
        text: value.slice(0, start) + marker + selected + marker + value.slice(end),
        selStart: start + m,
        selEnd: end + m
    };
};
