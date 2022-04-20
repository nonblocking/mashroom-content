import React, {useCallback, useState} from 'react';
import {useSelector} from 'react-redux';

import type {ReactNode, SyntheticEvent} from 'react';
import type {State} from '../types';

type Props = {
    onDragOver?: (x: number, y: number) => void;
    onDragLeave?: () => void;
    onDrop?: (data: Array<File>, x: number, y: number) => void;
    children: ReactNode;
};

export default ({onDragOver, onDragLeave, onDrop, children}: Props) => {
    const {typeFilter} = useSelector((state: State) => state.search);
    const [dragOver, setDragOver] = useState(false);
    const filterAcceptedItems = useCallback((event: SyntheticEvent<HTMLDivElement, DragEvent>): Array<DataTransferItem> => {
        const acceptedItems = [];
        if (event.nativeEvent.dataTransfer && event.nativeEvent.dataTransfer.types) {
            const {types, items} = event.nativeEvent.dataTransfer;
            if (types[0] === 'Files') {
                for (let i = 0; i < items.length; i++) {
                    if (!typeFilter || items[i].type.indexOf(`${typeFilter}/`) === 0) {
                        acceptedItems.push(items[i]);
                    }
                }
            }
        }
        return acceptedItems;
    }, [typeFilter]);
    const internalOnDragOver = useCallback((event: SyntheticEvent<HTMLDivElement, DragEvent>) => {
        const acceptedItems = filterAcceptedItems(event);
        if (acceptedItems.length > 0) {
            event.preventDefault();
            setDragOver(true);
            if (onDragOver) {
                onDragOver(event.nativeEvent.clientX, event.nativeEvent.clientY);
            }
        }
    }, [onDragOver]);
    const internalOnDragLeave = useCallback(() => {
        setDragOver(false);
        if (onDragLeave) {
            onDragLeave();
        }
    }, [onDragLeave]);
    const internalOnDrop = useCallback((event: SyntheticEvent<HTMLDivElement, DragEvent>) => {
        const acceptedItems = filterAcceptedItems(event);
        if (acceptedItems.length > 0) {
            setDragOver(false);
            event.preventDefault();
            const files = acceptedItems.map((i) => i.getAsFile()!);
            if (onDrop) {
                onDrop(files, event.nativeEvent.clientX, event.nativeEvent.clientY);
            }
        }
    }, [onDrop]);

    return (
        <div
            className='mashroom-content-media-library-drop-target'
            onDragOver={internalOnDragOver}
            onDragLeave={internalOnDragLeave}
            onDrop={internalOnDrop}
        >
            <div className={`drop-feedback ${dragOver ? 'show' : ''}`} >
                <div className="drop-icon" />
            </div>
            {children}
        </div>
    );
};
