import React from 'react';

const TLDS = "com|org|net|io|app|dev|in|co|me|ai|edu|gov|xyz|info|tech|online|site|store|us|uk|ly|tv|gg|so|sh|cc|to|fm|ca|de|fr|au|ink|page|blog";
// full urls, www.* and bare domains such as fb.com or my-site.vercel.app/path
const URL_SOURCE = `(?:https?:\\/\\/|www\\.)[^\\s<>"']+|\\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:${TLDS})\\b(?:\\/[^\\s<>"']*)?`;
const URL_REGEX = new RegExp(`(${URL_SOURCE})`, 'gi');
const IMAGE_URL_REGEX = /^https?:\/\/[^\s?#]+\.(?:png|jpe?g|gif|webp|avif)(?:[?#]\S*)?$/i;
const TRAILING_PUNCTUATION = /[.,!?;:)\]}]+$/;

const splitTrailing = (url) => {
    const match = url.match(TRAILING_PUNCTUATION);
    return match ? [url.slice(0, -match[0].length), match[0]] : [url, ''];
};

const toHref = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

export const findImageUrls = (text) =>
    ((text || '').match(URL_REGEX) || [])
        .map((u) => toHref(splitTrailing(u)[0]))
        .filter((u) => IMAGE_URL_REGEX.test(u))
        .slice(0, 3);

const linkClass = "underline underline-offset-2 break-words dark:text-sky-300 text-fuchsia-800 hover:opacity-80";

const codeClass = "px-1 rounded font-mono text-[0.9em] dark:bg-white/15 bg-black/15 break-words";

// One scan over the text. Alternatives are tried left to right at every position, so a link is never
// cut up by an underscore inside it, and **bold with a link inside** still works.
// Markdown content must start and end with a non-space ("2 * 3 * 4" is not italic).
const INLINE = new RegExp([
    '`([^`\\n]+)`',                                                      // 1 code
    '\\*\\*\\*(?!\\s)([^*\\n]*?[^\\s*])\\*\\*\\*',                       // 2 bold + italic
    '\\*\\*(?!\\s)((?:[^*\\n]|\\*(?!\\*))*?[^\\s*])\\*\\*',              // 3 bold (may contain *italic*)
    '~~(?!\\s)([^~\\n]*?[^\\s~])~~',                                       // 4 strikethrough
    '(?<![\\w*])\\*(?!\\s)([^*\\n]*?[^\\s*])\\*(?![\\w*])',                    // 5 italic *text*
    '(?<!\\w)_(?!\\s)([^_\\n]*?[^\\s_])_(?!\\w)',                             // 6 italic _text_
    '([A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,})',                            // 7 email
    `(${URL_SOURCE})`,                                                     // 8 url
    '(bhai)'                                                               // 9 highlighted word
].join('|'), 'gi');

// links / emails / highlighted "bhai" / **bold** / *italic* / ~~strike~~ / `code` inside one line of text
const renderInline = (text, depth = 0) => {
    const out = [];
    const re = new RegExp(INLINE.source, 'gi');
    let last = 0;
    let match;

    while ((match = re.exec(text)) !== null) {
        if (match.index > last) out.push(text.slice(last, match.index));
        const key = out.length;
        const [, code, boldItalic, bold, strike, italicA, italicB, email, url, word] = match;
        const inner = (t) => (depth < 2 ? renderInline(t, depth + 1) : t);

        if (code) out.push(<code key={key} className={codeClass}>{code}</code>);
        else if (boldItalic) out.push(<strong key={key}><em>{inner(boldItalic)}</em></strong>);
        else if (bold) out.push(<strong key={key}>{inner(bold)}</strong>);
        else if (strike) out.push(<del key={key} className="opacity-80">{inner(strike)}</del>);
        else if (italicA || italicB) out.push(<em key={key}>{inner(italicA || italicB)}</em>);
        else if (email) out.push(<a key={key} href={`mailto:${email}`} className={linkClass}>{email}</a>);
        else if (url) {
            const [clean, trailing] = splitTrailing(url);
            out.push(
                <React.Fragment key={key}>
                    <a href={toHref(clean)} target="_blank" rel="noopener noreferrer nofollow" className={linkClass}>{clean}</a>
                    {trailing}
                </React.Fragment>
            );
        }
        else if (word) out.push(<span key={key} className="bhai-text">{word}</span>);

        last = match.index + match[0].length;
        if (match[0].length === 0) re.lastIndex++; // safety, cannot loop forever
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
};

const NUMBERED = /^\s*(\d{1,3})[.)]\s+(.*)$/;
const BULLET = /^\s*[-*\u2022]\s+(.*)$/;

const listType = (line) => (NUMBERED.test(line) ? 'ol' : BULLET.test(line) ? 'ul' : null);

// turns message text into React nodes: lists (1. 2. 3. / - item), clickable links / emails,
// highlighted "bhai" and line breaks
export const renderMessage = (text) => {
    const lines = (text || '').split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const type = listType(lines[i]);

        if (lines[i].trim().startsWith('```')) {
            // fenced code block, runs to the closing ``` (or the end of the message)
            const code = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
            i++;
            blocks.push(
                <pre key={`c${blocks.length}`} className="my-1 p-2 rounded-lg overflow-x-auto font-mono text-sm whitespace-pre dark:bg-black/40 bg-black/20">{code.join('\n')}</pre>
            );
        } else if (type) {
            const items = [];
            while (i < lines.length && listType(lines[i]) === type) {
                items.push((type === 'ol' ? lines[i].match(NUMBERED)[2] : lines[i].match(BULLET)[1]));
                i++;
            }
            const start = type === 'ol' ? Number(lines[i - items.length].match(NUMBERED)[1]) : undefined;
            const Tag = type;
            blocks.push(
                <Tag
                    key={`l${blocks.length}`}
                    start={start}
                    className={`${type === 'ol' ? 'list-decimal' : 'list-disc'} pl-6 my-1 space-y-0.5`}
                >
                    {items.map((item, n) => <li key={n} className="pl-1">{renderInline(item)}</li>)}
                </Tag>
            );
        } else {
            const para = [];
            while (i < lines.length && !listType(lines[i]) && !lines[i].trim().startsWith('```')) {
                para.push(lines[i]);
                i++;
            }
            blocks.push(
                <div key={`t${blocks.length}`}>
                    {para.map((line, n) => (
                        <React.Fragment key={n}>
                            {n > 0 && <br />}
                            {renderInline(line)}
                        </React.Fragment>
                    ))}
                </div>
            );
        }
    }
    return blocks;
};
