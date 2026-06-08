import { useState } from 'react';
import iso8601 from 'iso8601-duration';

function VideoItem(props) {
    const [isVideoSeen, setIsVideoSeen] = useState(props.seen(props.video.id));
    const videoSeenClass = isVideoSeen ? ' videoSeen' : '';

    function handleChange(event) {
        props.seen(props.video.id, event.target.checked);
        setIsVideoSeen(event.target.checked);
    }

    function handleClick() {
        props.seen(props.video.id, true);
        setIsVideoSeen(true);
    }

    function getPlublishDate(utcDateStr) {
        let utcDate = new Date(utcDateStr);
        return utcDate.toLocaleDateString('fr-FR',
            {
                day: 'numeric', month: 'numeric', year: '2-digit',
                hour: 'numeric', minute: 'numeric'/*, second: 'numeric'*/
            });
    }

    function getDuration(isoDurationStr) {
        if (isoDurationStr) {
            const dur = iso8601.parse(isoDurationStr);
            return `${Math.ceil(iso8601.toSeconds(dur) / 60.)} min`;
        }
        return '';
    }

    return (
        <li>
            <div className="videoItem">
                <div className={"videoThumbnail" + videoSeenClass}>
                    <a href={props.video.url}
                        target="_blank" rel="noopener noreferrer"
                        onClick={handleClick}>
                        <img src={props.video.thumbnail} />
                    </a>
                </div>
                <div className="videoCaption">
                    <div className={"videoSeenItem " + videoSeenClass}>
                        <input
                            id={`seenInputToggle-${props.video.id}`}
                            className="videoSeenButton"
                            type="checkbox"
                            checked={isVideoSeen}
                            onChange={handleChange} />
                        <label for={`seenInputToggle-${props.video.id}`}>
                            {isVideoSeen ? "Viewed" : "Not viewed"}
                        </label>
                    </div>
                    <div className="videoTitleItem">
                        <span>{getPlublishDate(props.video.publishedAt)}</span>
                        <span> ({getDuration(props.video.videoLen)})</span>
                        <div>{props.video.title}</div>
                    </div>
                </div>
            </div>
        </li>
    );
}

export default VideoItem;