import React from "react";

const EMOJIS = [
    "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😅", "😉", "🙂",
    "😢", "😭", "😡", "😱", "🥳", "😴", "🤗", "🙄", "😏", "🤩", "😇", "🤯",
    "👍", "👎", "👏", "🙌", "🙏", "💪", "👋", "🤝", "✌️", "🤞", "👀", "🫡",
    "❤️", "💔", "💯", "🔥", "✨", "🎉", "🎂", "🌹", "☕", "🍕", "🚀", "⭐"
];

const EmojiPicker = ({ onPick }) => (
    <div className="absolute bottom-14 left-4 z-30 w-64 p-2 grid grid-cols-8 gap-1 rounded-xl dark:bg-gray-900 bg-white shadow-xl border dark:border-white/10 border-black/10">
        {EMOJIS.map((e) => (
            <button key={e} type="button" aria-label={`Insert ${e}`} onClick={() => onPick(e)} className="text-xl h-7 w-7 rounded hover:bg-black/10 dark:hover:bg-white/10">
                {e}
            </button>
        ))}
    </div>
);

export default EmojiPicker;
