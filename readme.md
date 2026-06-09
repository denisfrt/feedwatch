# Feedwatch

This simple application will just fetch video availability status of multiple youtube channels and keep track of their view status.  
Naturally, these features are not really needed when you are logged into your google account and subscribed to channels but it's still useful to me to quickly check without having to log in.  
This is also my first dev with react/js, nodejs and tauri.

## Usage

Once configured (see [Installation](#installation)), the main application window will look like this:
![Starting view](docs/images/start.png)

Click on the clockwork button to enter edit mode and edit/add channels:
![Edit view](docs/images/add.png)

Click add to start watching the given channel. This will display thumbnails of the 10 last uploaded videos:
![Edit view](docs/images/view1.png)

1 - Add another channel  
2 - Change the name of the channel  
3 - Remove the channel  
4 - Reset channel name if it was modified  
5 - Video status (viewed)  
6 - Video status (not viewed)  

Once all channels have, you can click again on the clockwork button to disable edit mode:
![Normal view](docs/images/view2.png)

**Remarks**:
 - number of not viewed videos is displayed next to channel name
 - clicking on a video thumbnail will start video playing and note it as viewed (you can still manually set the view status with the button below it).


## Installation

Youtube API access is either gated by oauth or API key. Currently, only API key access is supported. To use this application, you need to create an API key on following these [instructions](https://developers.google.com/youtube/registering_an_application).

### Linux
 - download feedwatch_X.X.X_amd64.AppImage file
 - Add execute rights:
 ```
 chmod +x feedwatch_X.X.X_amd64.AppImage file
 ```
 - starting the app a first time will create a default configuration file in ~/.config/com.feedwatch/.env.example. Copy it to create a .env.production file:
 ```
 cp ~/.config/com.feedwatch/.env.example ~/.config/com.feedwatch/.env.production
 ```
 - edit ~/.config/com.feedwatch/.env.production and you created API key:
 ```
 YOUTUBE_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXX
 ```
 - restarting the application should then work fine.

### Windows
 - download feedwatch_0.1.0_x64_en-US.msi file
 - double click on it to install
 - starting the app a first time will create a default configuration file in %APPDATA%/com.feedwatch/.env.example. Copy it in the same directory to create a .env.production file.
 - edit %APPDATA%/com.feedwatch/.env.production and you created API key:
 ```
 YOUTUBE_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXX
 ```
 - restarting the application should then work fine.
