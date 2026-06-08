import { useState, useEffect, useRef } from 'react';
import { uiLogger } from '../scripts/logger';
import { api } from '../scripts/api';
import { persist } from '../scripts/persist';
import VideoItem from './VideoItem';
import { useCallback } from 'react';

function Feed(props) {
    const [newHandle, setNewHandle] = useState(props.handle);
    const [isLoading, setIsLoading] = useState(props.handle !== '');
    const [notViewedCount, setNotViewedCount] = useState(0);
    const [isError, setIsError] = useState(null);

    const seenVideos = useRef([]);

    const doDispatch = useCallback((id, videos) => {
        props.dispatch({ type: 'setVideos', id: id, videoList: videos });
    }, [props]);

    // load videos
    useEffect(() => {
        uiLogger.debug(`Feed.useEffect: handle=${props.handle} init=${props.isInitialized}`);
        let cancelled = false;
        const fetchData = async () => {
            try {
                const videos = await api.get(`/api/yt/feed?handle=${props.handle}`);
                if (!cancelled) {
                    doDispatch(props.id, videos);
                    setIsError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setIsError(err);
                    setIsLoading(false);
                }
            }
        };
        if (!props.isInitialized && props.handle) {
            fetchData()
        }
        return () => {
            cancelled = true;
        };
    }, [props.isInitialized, props.handle, props.id, doDispatch]);

    const getNotViewedCount = useCallback(() => {
        return props.videos.reduce(
            (acc, val) => acc + (seenVideos.current.includes(val.id) ? 0 : 1), 0);
    }, [props.videos]);

    // load videos seen status
    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                const persistSeenVideos = await persist.getSeen(props.handle);
                if (persistSeenVideos) {
                    // Remove videoId not in current video list
                    const updatedSeenVideos = persistSeenVideos.filter((id) => {
                        return props.videos.find((video) => video.id === id);
                    });
                    if (updatedSeenVideos.length != seenVideos.current.length) {
                        seenVideos.current = updatedSeenVideos;
                        await persist.setSeen(props.handle, JSON.stringify(seenVideos.current));
                        setNotViewedCount(getNotViewedCount());
                    }
                }
                if (!cancelled) {
                    setIsLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setIsError(err);
                    setIsLoading(false);
                }
            }
        };
        if (props.isInitialized && props.handle) {
            fetchData()
        }
        return () => {
            cancelled = true;
        };
    }, [props.videos, props.handle, props.isInitialized, getNotViewedCount]);

    function seen(id, value) {
        let idx = seenVideos.current.indexOf(id);
        let updated = false;
        if (value === true && idx < 0) {
            uiLogger.debug('seen ' + id + ' (' + idx + ') = true');
            seenVideos.current.push(id);
            updated = true;
        } if (value === false && idx >= 0) {
            uiLogger.debug('seen ' + id + ' (' + idx + ') = false');
            seenVideos.current.splice(idx, 1);
            updated = true;
        } else {
            value = (idx >= 0);
        }
        if (updated) {
            persist.setSeen(props.handle, JSON.stringify(seenVideos.current));
            setNotViewedCount(getNotViewedCount());
        }
        return value;
    }

    const isEmpty = props.handle === '';
    const videoList = props.videos
        .map((video) => (
            <VideoItem
                key={video.id}
                video={video}
                seen={seen} />
        ));

    function handleUpdateButton() {
        if (newHandle) {
            // clear storage for old handle
            if (props.handle) {
                persist.delHandle(props.handle);
            }
            // add new handle to storage
            persist.setHandle(newHandle);
            props.dispatch({ type: 'edit', id: props.id, newHandle });
        }
    }

    function handleDeleteButton() {
        // clear storage of feed being deleted
        persist.delHandle(props.handle);
        props.dispatch({ type: 'delete', id: props.id });
    }

    const viewTitleTemplate = (
        <h2 className="ytf-title">{props.handle} {notViewedCount !== 0 && `(${notViewedCount})`}</h2>
    );
    const editTitleTemplate = (
        <h3>
            <input
                id={props.id}
                type="text"
                value={newHandle}
                onChange={(event) => setNewHandle(event.target.value)}
            />
            <button
                type="button"
                onClick={() => setNewHandle(props.handle)}>
                Reset
            </button>
            <button
                type="button"
                onClick={handleUpdateButton}>
                {isEmpty ? "Add" : "Update"}
            </button>
            {!isEmpty &&
                <button
                    type="button"
                    onClick={handleDeleteButton}>
                    Delete
                </button>}
        </h3>
    );

    const loadingTemplate = (
        <h2 className="load-wrapper">
            <div className='load-spinner' />
            <div className='load-text' >Loading...</div>
        </h2>
    );
    const errorTemplate = (
        <h2>Loading error: {isError?.message}</h2>
    );
    const feedTemplate = (
        <ul
            className="ytf-gallery"
            role="list">
            {videoList}
        </ul>
    );

    return (
        <div style={{ borderBottom: '1px solid' }}>
            {props.isEditing
                ? editTitleTemplate
                : viewTitleTemplate}
            {isLoading
                ? loadingTemplate
                : isError
                    ? errorTemplate
                    : feedTemplate}
        </div>
    );
}

export default Feed;