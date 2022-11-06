import React, {useCallback, useContext, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {IntlContext} from 'react-intl';
import debounce from 'lodash.debounce';
import {MAX_HITS} from '../constants';
import {searchAssets, setSearchQuery, setSearchSkip, setTypeFilter} from '../store/actions';

import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {State, Dispatch} from '../types';

type Props = {
    contentService: MashroomContentClientService;
}

export default ({contentService}: Props) => {
    const {query, running, skip, typeFilter} = useSelector((state: State) => state.search);
    const {modalMode, typeFilter: typeFilterConfig} = useSelector((state: State) => state.config);
    const dispatch = useDispatch() as Dispatch;
    const {formatMessage} = useContext(IntlContext);
    const debouncedSearch = useMemo(() => debounce(() => dispatch(searchAssets(contentService, MAX_HITS, skip)), 250), [skip]);
    const updateTypeFilter = useCallback((type: string) => {
        dispatch(setTypeFilter(type));
        debouncedSearch();
        dispatch(setSearchSkip(undefined));
    }, []);
    const updateQuery = useCallback((query: string) => {
        dispatch(setSearchQuery(query));
        debouncedSearch();
        dispatch(setSearchSkip(undefined));
    }, []);
    useEffect(() => {
        debouncedSearch();
    }, [skip]);

    const typeFilterReadonly = modalMode && !!typeFilterConfig;

    return (
        <div className="mashroom-content-media-library-search-bar">
            {query && running && <div className="searching"/>}
            <div className="type-filter">
                <select
                    value={typeFilter || undefined}
                    onChange={(e) => updateTypeFilter(e.target.value)}
                    disabled={typeFilterReadonly}
                >
                    <option value="">
                        {formatMessage({ id: 'allTypes' })}
                    </option>
                    <option value="image">
                        {formatMessage({ id: 'images' })}
                    </option>
                    <option value="video">
                        {formatMessage({ id: 'videos' })}
                    </option>
                </select>
            </div>
            <div className="filter">
                <input type="search"
                       placeholder={formatMessage({ id: 'nameFilter' })}
                       onChange={(e) => updateQuery(e.target.value)} value={query || ''} />
            </div>
        </div>
    )
}
