import { useState, useEffect } from 'react';
import FeedList from './components/FeedList';
import ImgSettings from './assets/settings.svg';
import ImgToggleOn from './assets/toggle_on.svg';
import ImgToggleOff from './assets/toggle_off.svg';
import { uiLogger } from './scripts/logger';
import { persist } from './scripts/persist'
import { isAlive, getAuthUrl } from './scripts/api'

function App(props) {
    const [isEditing, setEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ytHandles, setYtHandles] = useState(props.ytHandles);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnectable, setIsConnectable] = useState(false);

    useEffect(() => {
        uiLogger.debug('App.useEffect');
        let cancelled = false;
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const status = await isAlive();
                uiLogger.debug(`status=${JSON.stringify(status)}`);
                const savedHandles = await persist.getHandles();
                if (!cancelled) {
                    setYtHandles(ytHandles => [...new Set([...ytHandles, ...savedHandles])]);
                    setIsConnectable(status.connectable);
                    setIsConnected(status.connected);
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

    async function handleConnect() {
        if (!isConnected) {
            window.location.href = getAuthUrl(true);
        } else {
            await fetch(getAuthUrl(false), { method: 'POST' });
            window.location.href = "/";
        }
    }

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

    const settingButtonTemplate = (
        <button id="settings-button"
            onClick={() => setEditing(!isEditing)} >
            <img src={ImgSettings} />
        </button>
    );

    const connectButtonTemplate = (
        <button id="connect-button"
            onClick={handleConnect} >
            <img src={isConnected ? ImgToggleOn : ImgToggleOff} />
        </button>
    );

    return (
        <>
            <h1>
                Feed Watch
                {isConnectable && connectButtonTemplate}
                {isConnected && settingButtonTemplate}
            </h1>
            {isLoading && loadingTemplate}
            {isConnected && feedListTemplate}
        </>
    );
}

export default App;
