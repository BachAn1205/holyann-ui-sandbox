const fs = require('fs');
let t = fs.readFileSync('src/components/chat/MessageInput.tsx', 'utf8');

t = t.replace(
    'isMentor?: boolean;           // Show calendar button only for mentors\r\n}',
    'isMentor?: boolean;           // Show calendar button only for mentors\r\n    hideAttachments?: boolean;    // Hide attachment and image buttons\r\n}'
);

t = t.replace(
    'isMentor?: boolean;           // Show calendar button only for mentors\n}',
    'isMentor?: boolean;           // Show calendar button only for mentors\n    hideAttachments?: boolean;    // Hide attachment and image buttons\n}'
);

t = t.replace(
    'isMentor = false,\r\n}) => {',
    'isMentor = false,\r\n    hideAttachments = false,\r\n}) => {'
);
t = t.replace(
    'isMentor = false,\n}) => {',
    'isMentor = false,\n    hideAttachments = false,\n}) => {'
);

t = t.replace(
    '<div className="flex items-center gap-0.5 md:gap-1">\r\n                    <button\r\n                        onClick={() => fileInputRef.current?.click()}',
    '<div className="flex items-center gap-0.5 md:gap-1">\r\n                    {!hideAttachments && (\r\n                        <>\r\n                    <button\r\n                        onClick={() => fileInputRef.current?.click()}'
);
t = t.replace(
    '<div className="flex items-center gap-0.5 md:gap-1">\n                    <button\n                        onClick={() => fileInputRef.current?.click()}',
    '<div className="flex items-center gap-0.5 md:gap-1">\n                    {!hideAttachments && (\n                        <>\n                    <button\n                        onClick={() => fileInputRef.current?.click()}'
);

t = t.replace(
    'title="Đính kèm ảnh"\r\n                    >\r\n                        <Image size={18} className="md:w-5 md:h-5" />\r\n                    </button>\r\n\r\n                    {/* Calendar button — mentor only */}',
    'title="Đính kèm ảnh"\r\n                    >\r\n                        <Image size={18} className="md:w-5 md:h-5" />\r\n                    </button>\r\n                        </>\r\n                    )}\r\n\r\n                    {/* Calendar button — mentor only */}'
);
t = t.replace(
    'title="Đính kèm ảnh"\n                    >\n                        <Image size={18} className="md:w-5 md:h-5" />\n                    </button>\n\n                    {/* Calendar button — mentor only */}',
    'title="Đính kèm ảnh"\n                    >\n                        <Image size={18} className="md:w-5 md:h-5" />\n                    </button>\n                        </>\n                    )}\n\n                    {/* Calendar button — mentor only */}'
);

fs.writeFileSync('src/components/chat/MessageInput.tsx', t);
console.log('Done!');
