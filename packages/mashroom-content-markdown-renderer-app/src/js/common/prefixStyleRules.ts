
export default (cssPrefixClass: string, style: string): string => {
    const lines = style
        .replace(/}/gm, '\n}\n') // Make sure all rules are in separate lines
        .split('\n');
    let result = '';
    let withinARule = false;
    lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return;
        }
        if (trimmedLine.indexOf('{') !== -1) {
            if (trimmedLine.indexOf('@') === -1) {
                withinARule = true;
                result += ' ';
                result += trimmedLine
                    .split(',')
                    .map((selector) => `.${cssPrefixClass} ${selector.trim()}`)
                    .join(', ');
            } else {
                result += ` ${trimmedLine}`;
            }
        } else {
            if (trimmedLine.indexOf('}') !== -1) {
                withinARule = false;
                result += ` ${trimmedLine}`;
            } else if (withinARule) {
                result += ` ${trimmedLine}`;
            } else {
                // A property outside any rule
                result += ` .${cssPrefixClass} { ${trimmedLine} }`;
            }
        }
    });

    return result;
}
