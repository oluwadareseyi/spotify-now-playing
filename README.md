# Display what you're currently listening to on Spotify

## Useful links

- [Airtable](https://airtable.com/).
- [Airtable API](https://airtable.com/api).
- [Spotify Dashboard](https://developer.spotify.com/dashboard/applications).
- [Spotify refresh token](https://benwiz.com/blog/create-spotify-refresh-token/)

## Spotify

To get a Spotify client id and secret, you need to log into your [Spotify Dashboard](https://developer.spotify.com/dashboard/applications) and create an app. You can call the app whatever you want, but I called mine "Now Playing". Once you've created the app, you'll be able to see your client id and secret. You'll need these to get your refresh token.

## Spotify refresh token

Spotify's token expires every hour, so you need to get a new one each time it expires. To do this, you need to get a refresh token. To learn how to get a refresh token, read [this article](https://benwiz.com/blog/create-spotify-refresh-token/).


## Airtable

We use airtable to store the current token and update it everytime a new one is fetched, and to also add an expiry date.

Create an airtable account and a table in airtable with the following fields:
- token.
- expiry.
- created.

<img width="1132" alt="image" src="https://user-images.githubusercontent.com/48622375/194784185-f79cf04c-b47b-4ede-9d7e-4b7c9cd04f63.png">


Then, go to the [Airtable API page](https://airtable.com/api) and get your API key (check "show API key") and base id for the new table.

<img width="1438" alt="image" src="https://user-images.githubusercontent.com/48622375/194784203-7b67196a-d92d-42ad-9142-afa060c54e66.png">

Create a .env file in the root of the project and add the following vars:

- SPOTIFY_CLIENT_ID - Your Spotify client ID
- SPOTIFY_CLIENT_SECRET - Your Spotify client secret
- SPOTIFY_REFRESH_TOKEN - Your Spotify refresh token
- AIRTABLE_API_KEY - Your Airtable API key
- AIRTABLE_BASE_ID - The base id of the airtable document you create

After this, run the app and you should be good to go.
