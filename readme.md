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
 - channels display order can be changed by dragging & dropping their titles up or down.


## Installation

Youtube API access is either gated by OAuth or API key.
 - **API key**: this is the simplest method, you can create an API key by following these [instructions](https://developers.google.com/youtube/registering_an_application).
 - **OAuth2**: this method will require your user to authorize your application to access their account to make API calls. You will need to create a web-server app client id (see [instructions](https://developers.google.com/identity/protocols/oauth2/web-server)).

 **Note**: since this application is desktop, api keys or client id/secret are stored in .env file and should not be considered securely stored if you share access to your machine.

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
 - edit ~/.config/com.feedwatch/.env.production and either set your API key or your client id/secret (OAuth):
 ```
 YOUTUBE_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXX
 YOUTUBE_CLIENT_ID=XXXXXXX-XXXXXXXXXXX.apps.googleusercontent.com
 YOUTUBE_CLIENT_SECRET=XX-XXXXXXXXXXXXXX
```
 - restarting the application should then work fine.

### Windows
 - download feedwatch_X.X.X_x64_en-US.msi file
 - double click on it to install
 - starting the app a first time will create a default configuration file in %APPDATA%/com.feedwatch/.env.example. Copy it in the same directory to create a .env.production file.
 - edit %APPDATA%/com.feedwatch/.env.production and either set your API key or your client id/secret (OAuth):
 ```
 YOUTUBE_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXX
 YOUTUBE_CLIENT_ID=XXXXXXX-XXXXXXXXXXX.apps.googleusercontent.com
 YOUTUBE_CLIENT_SECRET=XX-XXXXXXXXXXXXXX
 ```
 - restarting the application should then work fine.
