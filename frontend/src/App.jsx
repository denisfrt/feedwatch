import { useState, useEffect } from 'react';
import FeedList from './components/FeedList';
import ImgSettings from './assets/settings.svg';
import { uiLogger } from './scripts/logger';
import { persist } from './scripts/persist'
import { isAlive } from './scripts/api'

function App(props) {
    const [isEditing, setEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ytHandles, setYtHandles] = useState(props.ytHandles);

    useEffect(() => {
        uiLogger.debug('App.useEffect');
        let cancelled = false;
        const fetchData = async () => {
            try {
                setIsLoading(true);
                await isAlive();
                const savedHandles = await persist.getHandles();
                if (!cancelled) {
                    setYtHandles(ytHandles => [...new Set([...ytHandles, ...savedHandles])]);
                    setIsLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    uiLogger.error(err);
                    setIsLoading(false);
                }
            }
        };
        fetchData();
        return () => {
            cancelled = true;
        };
    }, [props.ytHandles]);

    const loadingTemplate = (
        <h2 className="load-wrapper">
            <div className='load-spinner' />
            <div className='load-text' >Loading...</div>
        </h2>
    );

    const feedListTemplate = (
        <FeedList
            ytHandles={ytHandles}
            isEditing={isEditing} />
    );

    return (
        <>
            <h1>
                Feed Watch
                <button id="settings-button"
                    onClick={() => setEditing(!isEditing)} >
                    <img src={ImgSettings} />
                </button>
            </h1>
            {isLoading ? loadingTemplate : feedListTemplate}
        </>
    );
}

export default App;
