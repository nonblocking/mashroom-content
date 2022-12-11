import type {ReactCodeMirrorRef} from '@uiw/react-codemirror';

export default (cm: ReactCodeMirrorRef, wrap: (text: string) => string, moveSelection?: number): boolean => {
    if (!cm.view?.state) {
        return false;
    }
    const range = cm.view.state.selection.ranges[0];
    if (range.empty) {
        // No selection
        return false;
    }

    const selection = cm.view.state.doc.slice(range.from, range.to).toString();

    cm.view?.dispatch({
        changes: {
            from: range.from,
            to: range.to,
            insert: wrap(selection),
        },
        selection: {
            head: range.from + (moveSelection ?? 0),
            anchor: range.to + (moveSelection ?? 0),
        },
    });

    setTimeout(() => {
        cm.view?.focus();
    }, 0);

    return true;
};
