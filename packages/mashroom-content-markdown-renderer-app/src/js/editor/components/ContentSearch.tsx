import React, {useMemo, useCallback, useContext, useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {IntlContext, FormattedMessage} from 'react-intl';
import debounce from 'lodash.debounce';
import {loadSearchHit, searchContent, setSearchQuery} from '../store/actions';
import ContentSearchHits from './ContentSearchHits';
import EditorContext from '../EditorContext';

import type {EditorState} from '../../types';

const MAX_HITS = 5;

export default () => {
    const [skip, setSkip] = useState<number | undefined>();
    const {query, result, running, error} = useSelector((state: EditorState) => state.search);
    const dispatch = useDispatch();
    const {contentService} = useContext(EditorContext);
    const debouncedSearch = useMemo(() => debounce(() => dispatch(searchContent(contentService, MAX_HITS, skip)), 250), []);
    const updateQuery = useCallback((query: string) => {
        dispatch(setSearchQuery(query));
        debouncedSearch();
        setSkip(undefined);
    }, []);
    const showMore = useCallback(() => {
        setSkip((skip || 0) + MAX_HITS);
        debouncedSearch();
    }, []);
    const {formatMessage} = useContext(IntlContext);
    useEffect(() => {
        debouncedSearch();
    }, []);

    const searchPlaceholder = formatMessage({ id: 'filter' });

    return (
        <div className="content-search">
            <div className="content-search-bar">
                <input type="search" placeholder={searchPlaceholder} onChange={(e) => updateQuery(e.target.value)} value={query} />
                {query && running && <div className="searching"/>}
            </div>
            {!error && !result && running && (
                <div className="mashroom-portal-app-loading" >
                    <span />
                </div>
            )}
            {error && (
                <div className="mashroom-portal-app-loading-error" >
                    <FormattedMessage id='searchFailed' />
                </div>
            )}
            {!error && result && (
                <div className="content-hits">
                    <ContentSearchHits hits={result.hits} onOpen={(contentId) => dispatch(loadSearchHit(contentId))} />
                    {result.meta.total > (skip || 0) + MAX_HITS && (
                        <div className="show-more">
                            <a href="javascript:void(0)" onClick={showMore}>
                                <FormattedMessage id="showMore" />
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
