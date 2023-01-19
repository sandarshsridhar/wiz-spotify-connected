# wiz-spotify-connected

A service to sync your [Philips Wiz lights](https://www.wizconnected.com/) to playing Spotify music

## Features

* Built purely with Typescript and Express.js.
* Works with any Wiz light bulb that supports RGB.
* Uses [Spotify Audio Analysis API](https://developer.spotify.com/documentation/web-api/reference/#/operations/get-audio-analysis) to change lights automatically to the playing music. The app takes song's key, loudness and tempo into account to come up with the appropriate color for your light bulbs.
* Can change lights for any number of rooms seamlessly.
* Uses UDP to communicate with the bulbs.
* Adapts to music changes automatically when the song is changed, paused or stopped.
* Uses in-memory caching mechanism for efficiency and performance.

## Requirements

1. [Spotify developer account](https://developer.spotify.com/dashboard)
    * Create an app in the dashboard -> This creates your Client ID and Client Secret (You will need these when using this app).
    * Go to **EDIT SETTINGS** -> **Redirect URIs** -> add [http://localhost:8888/callback](http://localhost:8888/callback) (This is needed to get yourself authenticated when the app runs) -> hit **Save** to save your changes.
2. You will also need to allow UDP communication with Wiz. You can do this by going to the Wiz app -> **Settings** -> **Security** -> Enable <strong>Allow Local Communication</strong>.
3. You will need Node.js (16+) and NPM (8+) installed on your machine to run this app. If these are not installed, please install them before going to the next step.
4. Clone this repository.

## How to run

1. Run `npm i` in a terminal in the root of this repo. This will install all the necessary packages.
2. Create a file with name **.env** in the root of your folder and fill in the details using **sample-env** file present in the repo as a reference.
    <em>Note</em>: You may have to change the broadcast address depending on what your router uses. If you have trouble discovering lights with your router's broadcast address, please **remove that variable** from your **.env** file. This will make the app use the default broadcast address which is `255.255.255.255`.
3. Run `npm run start`.
4. Before the server is available to take requests, it gathers the IP and mac addresses of all the light bulbs in your home and saves them in its internal cache.
5. Once the startup is done, You will see "⚡️[server]: Server is running at [http://localhost:8888](http://localhost:8888)" in your console. Now, your app is ready to take requests.
6. Open your favorite browser and type in "[http://localhost:8888/login](http://localhost:8888/login)". This will get you authenticated with Spotify. You will see a pop up from Spotify asking you to authorize the request (This only happens the first time you use this app). Accept the terms and you will be redirected to "[http://localhost:8888/callback](http://localhost:8888/callback)".
7. [Only applicable if you would like to enable music sync in only selected rooms, if not, move on to Step 8], you can fetch the room IDs from "[http://localhost:8888/rooms](http://localhost:8888/rooms)".
    * This is the only manual piece to this app: Wiz bulbs do not record the room names or the bulb names in their local storage. Instead they have roomIds. So, you will have to determine the roomId by reading the API response.
        Sample API response

    ```json
      {
        "6931115": [ // Room ID
            [
                "10.0.0.1", // IP Address
                "b5a88aa7fc8b" // Mac Address
            ],
            [
                "10.0.0.2",
                "09e6cc66ab19"
            ]
        ],
        "6930575": [
            [
                "10.0.0.3",
                "86ecb549085c"
            ],
            [
                "10.0.0.4",
                "bdba05c279a9"
            ],
            [
                "10.0.0.5",
                "e9e122a2f987"
            ],
            [
                "10.0.0.6",
                "929e242d0e53"
            ]
         ]
      }
    ```
    * From the above example, you can easily determine your roomId from the number of objects in each roomId.
    * If your setup is a bit more complicated where you have similar number of bulbs in multiple rooms, you can simply go with trial and error method to determine the roomIds or you can check the mac addresses in your router's admin panel to determine the room they are in.
8. Now go to "[http://localhost:8888/dance-to-spotify](http://localhost:8888/dance-to-spotify)" or "[http://localhost:8888/dance-to-spotify?roomIds=6931115,6930575](http://localhost:8888/dance-to-spotify?roomIds=6931115,6930575)" (if you are enabling for selected rooms), and that's it.
9. If you would like to keep the app running but turn off the dance session, you can do so by calling "[http://localhost:8888/dance-to-spotify/abort](http://localhost:8888/dance-to-spotify/abort)" (Useful for running the app in the background in perpetuity).

***

If your Spotify music is playing, your lights should automatically change color to each beat synchronously. You can play with the app by pausing the music, changing the track, etc. If you stop the music completely, then the API call needs to be made again. This is done to preserve API rate limits and achieve efficiency.

<strong>Note</strong>: If you run into any issues, run the app in debug mode (`npm run start debug`) to determine the cause. If you prefer getting the debug logs in a file, you can run (`npm run start debug file`).

Hope you have fun! Thanks for checking out this repo! 😁

## References

* [pywizlight](https://github.com/sbidy/pywizlight)