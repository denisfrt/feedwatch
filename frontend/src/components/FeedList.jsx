import { useReducer, useRef } from 'react';
import { uiLogger } from '../scripts/logger';
import { ReactSortable } from 'react-sortablejs';
import { nanoid } from 'nanoid';
import { persist } from '../scripts/persist'
import Feed from './Feed';

function findFeedHandle(feeds, handle) {
    const lHandle = persist.rawHandle(handle);
    return feeds.find((feed) => persist.rawHandle(feed.handle) === lHandle);
}

function feedReducer(feeds, action) {
    uiLogger.debug('reducer: ' + JSON.stringify(action));
    switch (action.type) {
        case 'order':
            return action.orderedFeeds;
        case 'edit':
            if (action.id && action.newHandle && !findFeedHandle(feeds, action.newHandle)) {
                const updatedFeeds = feeds.map((feed) => {
                    if (action.id === feed.id) {
                        return {
                            ...feed,
                            handle: action.newHandle,
                            isInitialized: false,
                            videos: []
                        };
                    }
                    return feed;
                });
                return updatedFeeds;
            }
            break;
        case 'add':
            if ((action.handle || action.handle === '') && !findFeedHandle(feeds, action.handle)) {
                const newFeed = {
                    type: "ytf",
                    isInitialized: false,
                    id: `ytf-${nanoid()}`,
                    handle: action.handle,
                    videos: []
                };
                return [newFeed, ...feeds];
            }
            break;
        case 'delete':
            if (action.id) {
                const filteredFeeds = feeds.filter((feed) => feed.id !== action.id);
                return filteredFeeds;
            }
            break;
        case 'setVideos':
            if (action.id && action.videoList) {
                const videos = Array.isArray(action.videoList) ? action.videoList : [];
                const updatedFeeds = feeds.map((feed) => {
                    if (action.id === feed.id) {
                        return { ...feed, isInitialized: true, videos };
                    }
                    return feed;
                });
                return updatedFeeds;
            }
            break;
        case 'clear':
            return feeds.filter((feed) => feed.handle !== '');
        default:
            uiLogger.error(`Unexpected reducer action: ${action.type}`);
            break;

    }
    return feeds;
}

function feedReducerInit(ytHandles) {
    uiLogger.debug('reducerInit: ' + ytHandles);
    const initFeeds = ytHandles
        .map((handle) => {
            return {
                type: "ytf",
                id: `ytf-${nanoid()}`,
                handle,
                isInitialized: false,
                videos: [],
            };
        });
    return initFeeds;
}

function FeedList(props) {
    const [feeds, dispatch] = useReducer(feedReducer, props.ytHandles, feedReducerInit);
    const lastOrderedFeed = useRef(feeds.map((feed) => feed.handle));
    const updatedOrderedFeed = useRef(false);

    if (props.isEditing) {
        // Add an empty feed when editing to be able to add a new one
        if (feeds.length === 0 || feeds[0]?.handle) {
            dispatch({ type: 'add', handle: '' });
        }
    } else if (feeds[0]?.handle === '') {
        // Remove empty feed if not editing anymore
        dispatch({ type: 'clear' });
    }

    const feedList = feeds
        .map((feed) => (
            <li key={feed.id}>
                <Feed
                    id={feed.id}
                    key={feed.id}
                    handle={feed.handle}
                    videos={feed.videos}
                    isInitialized={feed.isInitialized}
                    isEditing={props.isEditing}
                    dispatch={dispatch}
                />
            </li>
        ));

    function onChangedOrder(orderedFeeds) {
        const newOrderedFeeds = orderedFeeds.map((feed) => feed.handle);
        const isEqual = newOrderedFeeds.length === lastOrderedFeed.current.length &&
            newOrderedFeeds.every((value, index) => value === lastOrderedFeed.current[index]);
        if (!isEqual) {
            lastOrderedFeed.current = newOrderedFeeds;
            updatedOrderedFeed.current = true;
            dispatch({ type: 'order', orderedFeeds });
        }
    }

    function onEndOrder() {
        if (updatedOrderedFeed.current) {
            updatedOrderedFeed.current = false;
            persist.setHandleOrder(lastOrderedFeed.current);
        }
    }

    return (
        <>
            <ReactSortable
                tag="ul"
                className='ytf-feeds'
                list={feeds}
                setList={onChangedOrder}
                onEnd={onEndOrder}>
                {feedList}
            </ReactSortable>
        </>
    );
}

export default FeedList;