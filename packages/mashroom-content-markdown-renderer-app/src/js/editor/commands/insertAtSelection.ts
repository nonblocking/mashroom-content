import type {ReactCodeMirrorRef} from '@uiw/react-codemirror';

export default (cm: ReactCodeMirrorRef, text: string, selectionFrom?: number, selectionTo?: number) => {
    if (!cm.view?.state) {
        return;
    }
    const range = cm.view.state.selection.ranges[0];

    cm.view?.dispatch({
        changes: {
            from: range.from,
            to: range.to,
            insert: text,
        },
        selection: {
            head: selectionTo ? range.from + (selectionFrom ?? 0) : undefined,
            anchor: selectionTo ? range.from + selectionTo : range.from + (selectionFrom ?? 0),
        },
    });

    setTimeout(() => {
        cm.view?.focus();
    }, 0);
};
