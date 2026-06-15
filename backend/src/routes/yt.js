import express from 'express';
import log from '../logger.js';
import { getCredentials } from './auth.js';

const router = express.Router();

// keep local memory cache of playlist ids
let globalUploadsPlaylistIds = {}

async function importApi(name, credentials) {
    if (name === 'google') {
        const { google } = await import('googleapis');
        const yt = google.youtube({
            version: "v3",
            auth: credentials.key ?? credentials.auth
        });
        return {
            getPlaylist: (handle) => yt.channels.list({
                part: ["contentDetails"],
                forHandle: handle
            }),
            getVideos: (uploadsPlaylistId) => yt.playlistItems.list({
                part: ["snippet"],
                playlistId: uploadsPlaylistId,
                maxResults: 10,
            }),
            getVideosInfo: (videoIdList) => yt.videos.list({
                part: ["contentDetails"],
                id: videoIdList.join(',')
            })
        };
    } else if (name === 'axios') {
        // default axios
        const axios = await import('axios');
        const axiosFetch = async (command, args) => {
            const baseUrl = "https://youtube.googleapis.com/youtube/v3/";
            let headers = { Accept: "application/json" };
            if (credentials.key) {
                args.set('key', credentials.key);
            } else {
                headers.Authorization = credentials.token;
            }
            let url = `${baseUrl}${command}?${args.toString()}`
            const response = await axios.default.get(url, { headers });
            return response;
        }
        return {
            getPlaylist: (handle) => {
                return axiosFetch('channels', new URLSearchParams({
                    part: 'contentDetails',
                    forHandle: handle
                }));
            },
            getVideos: (uploadsPlaylistId) => {
                return axiosFetch('playlistItems', new URLSearchParams({
                    part: 'snippet',
                    playlistId: uploadsPlaylistId,
                    maxResults: 10
                }));
            },
            getVideosInfo: (videoIdList) => {
                return axiosFetch('videos', new URLSearchParams({
                    part: 'contentDetails',
                    id: videoIdList.join(',')
                }));
            }
        };
    } else {
        const defaultFetch = async (command, args) => {
            const baseUrl = "https://youtube.googleapis.com/youtube/v3/";
            const headers = { Accept: "application/json" };
            if (credentials.key) {
                args.set('key', credentials.key);
            } else {
                headers.Authorization = credentials.token;
            }
            let url = `${baseUrl}${command}?${args.toString()}`
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const result = await response.json();
            return { status: response.status, data: result };
        }
        return {
            getPlaylist: (handle) => {
                return defaultFetch('channels', new URLSearchParams({
                    part: 'contentDetails',
                    forHandle: handle
                }));
            },
            getVideos: (uploadsPlaylistId) => {
                return defaultFetch('playlistItems', new URLSearchParams({
                    part: 'snippet',
                    playlistId: uploadsPlaylistId,
                    maxResults: 10
                }));
            },
            getVideosInfo: (videoIdList) => {
                return defaultFetch('videos', new URLSearchParams({
                    part: 'contentDetails',
                    id: videoIdList.join(',')
                }));
            }
        };
    }
}

/*
Replace 'UU' playlist id prefix to the following prefixes to filter by contents
prefix 	contents
UULF 	Videos
UULP 	Popular videos
UULV 	Live streams
UUMF 	Members-only videos
UUMO 	Members-only contents (videos, short videos and live streams)
UUMS 	Members-only short videos
UUMV 	Members-only live streams
UUPS 	Popular short videos
UUPV 	Popular live streams
UUSH 	Short videos
*/
async function fetchChannelVideos(api, handle) {
    let uploadsPlaylistId;
    // check if we already known the playlist id
    if (globalUploadsPlaylistIds[handle]) {
        uploadsPlaylistId = globalUploadsPlaylistIds[handle];
    } else {
        // Fetch upload playlist ids
        log.debug(`youtube.getPlaylist(${handle})`);
        const channelsRes = await api.getPlaylist(handle);
        uploadsPlaylistId = channelsRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    }
    // Save id in memory
    if (uploadsPlaylistId) {
        globalUploadsPlaylistIds[handle] = uploadsPlaylistId;
        // only fetch videos category
        uploadsPlaylistId = uploadsPlaylistId.replace(/^UU/, 'UULF');
    }
    // Fetch playlist videos information
    let data = {};
    if (uploadsPlaylistId) {
        log.debug(`youtube.getVideos(${uploadsPlaylistId})`);
        const videosRes = await api.getVideos(uploadsPlaylistId);
        const url = 'https://www.youtube.com/watch?v=';
        data = videosRes.data?.items?.map((item) => {
            const videoId = item.snippet?.resourceId?.videoId;
            return {
                id: item.id,
                title: item.snippet?.title,
                videoId: videoId,
                thumbnail: item.snippet?.thumbnails?.medium?.url,
                publishedAt: item.snippet?.publishedAt,
                url: videoId ? `${url}${videoId}` : ''
            };
        });
        // Fetch videos duration
        const videoIdList = data.map((v) => v.videoId);
        if (videoIdList) {
            log.debug(`youtube.getVideosInfo(${videoIdList.length} videos)`);
            const videoInfosRes = await api.getVideosInfo(videoIdList);
            // create video id => len map
            const videoLenById = videoInfosRes.data?.items?.reduce((r, item) => (
                r[item.id] = item.contentDetails?.duration, r
            ), {});
            // add videoLen property to result
            data = data.map((v) => (
                {
                    ...v,
                    videoLen: (videoLenById[v.videoId] || '')
                }
            ));
        }
    }
    return data;
}

/*
async function fetchChannelVideos2(api, handle) {
    let data = [];
    if (handle === 'LinusTechTips') {
        await new Promise(r => setTimeout(r, 2000));
        const json = '[{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LlhlazVmUldqT3Rn","title":"Every Little Thing is BETTER","thumbnail":"https://i.ytimg.com/vi/Xek5fRWjOtg/mqdefault.jpg","publishedAt":"2026-06-01T10:00:06Z","url":"https://www.youtube.com/watch?v=Xek5fRWjOtg"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LktXWUxUOGpIMHRj","title":"New ASUS XBOX ROG ALLY X20 looks insane","thumbnail":"https://i.ytimg.com/vi/KWYLT8jH0tc/mqdefault.jpg","publishedAt":"2026-06-01T09:59:32Z","url":"https://www.youtube.com/watch?v=KWYLT8jH0tc"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LkRfemlpY205MU80","title":"Daily Driving Meta Ray-Ban Display with Neural Handwriting","thumbnail":"https://i.ytimg.com/vi/D_ziicm91O4/mqdefault.jpg","publishedAt":"2026-05-30T22:18:34Z","url":"https://www.youtube.com/watch?v=D_ziicm91O4"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LlF1a3N1T1BSYnZJ","title":"Who has the Worst Monitor at Linus Tech Tips?","thumbnail":"https://i.ytimg.com/vi/QuksuOPRbvI/mqdefault.jpg","publishedAt":"2026-05-30T17:28:38Z","url":"https://www.youtube.com/watch?v=QuksuOPRbvI"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53Ljdxc3hkTGVrV1dr","title":"New Problems Need New Solutions - WAN Show May 29, 2026","thumbnail":"https://i.ytimg.com/vi/7qsxdLekWWk/mqdefault.jpg","publishedAt":"2026-05-30T02:45:18Z","url":"https://www.youtube.com/watch?v=7qsxdLekWWk"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LmJOcG1CMWhlRUYw","title":"Linux is Easy, right?","thumbnail":"https://i.ytimg.com/vi/bNpmB1heEF0/mqdefault.jpg","publishedAt":"2026-05-28T18:48:55Z","url":"https://www.youtube.com/watch?v=bNpmB1heEF0"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LlluRUtIdmtjNlA4","title":"Guess the Tech Acronym or Shoot","thumbnail":"https://i.ytimg.com/vi/YnEKHvkc6P8/mqdefault.jpg","publishedAt":"2026-05-27T21:38:46Z","url":"https://www.youtube.com/watch?v=YnEKHvkc6P8"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LkNjOTVIODZOZERj","title":"I tried building a PC in the 3rd person.","thumbnail":"https://i.ytimg.com/vi/Cc95H86NdDc/mqdefault.jpg","publishedAt":"2026-05-27T17:04:17Z","url":"https://www.youtube.com/watch?v=Cc95H86NdDc"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LjBrMEJRXzN1bXdN","title":"Surprising WHALE LAN Attendees!","thumbnail":"https://i.ytimg.com/vi/0k0BQ_3umwM/mqdefault.jpg","publishedAt":"2026-05-26T20:33:17Z","url":"https://www.youtube.com/watch?v=0k0BQ_3umwM"},{"id":"VVVYdXFTQmxIQUU2WHcteWVKQTBUdW53LkpnTi1QNjB2RkM4","title":"I Let Open Source AI Drive Me to Work","thumbnail":"https://i.ytimg.com/vi/JgN-P60vFC8/mqdefault.jpg","publishedAt":"2026-05-26T17:29:35Z","url":"https://www.youtube.com/watch?v=JgN-P60vFC8"}]';
        data = JSON.parse(json);
    }
    return data;
}*/

router.get('/feed', async (req, res) => {
    log.debug(`GET /yt/feed?handle=${req.query?.handle}`);
    try {
        if (!req.query?.handle) {
            throw { status: 403, message: 'missing handle param' };
        }
        const credentials = await getCredentials();
        const api = await importApi('default', credentials);
        const data = await fetchChannelVideos(api, req.query.handle);
        res.json(data);
    } catch (err) {
        res.status(err.status || 500).json({
            error: "Feed fetching failed.",
            details: err.message
        });
    }
});

export default router;
