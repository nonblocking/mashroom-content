
import React, {useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {IntlProvider} from 'react-intl';
import {setConfig, setTypeFilter} from '../store/actions';
import loadMessages from '../messages';
import Assets from './Assets';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';

type Props = {
    lang: string;
    modalMode: boolean;
    responseChannelTopic: string;
    typeFilter: string | null;
    messageBus: MashroomPortalMessageBus;
    contentService: MashroomContentClientService
}

export default ({lang, responseChannelTopic, modalMode, typeFilter, messageBus, contentService}: Props) => {
    const dispatch = useDispatch();
    const [messages, setMessages] = useState<Record<string, string>>({});
    useEffect(() => {
        dispatch(setConfig({
            modalMode,
            typeFilter,
            responseChannelTopic,
        }));
        dispatch(setTypeFilter(typeFilter));
        loadMessages(lang).then((messages) => setMessages((messages)));
    }, []);

    if (Object.keys(messages).length === 0) {
        return null;
    }

    return (
        <IntlProvider messages={messages} locale={lang}>
            <div className="mashroom-content-media-library-app">
                <Assets messageBus={messageBus} contentService={contentService} />
            </div>
        </IntlProvider>
    );
};
