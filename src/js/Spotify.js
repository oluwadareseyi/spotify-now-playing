import axios from "axios";
import Airtable from "airtable";
import { mapElements } from "./utils/dom";

export default class Spotify {
  constructor(element) {
    this.element = element;
    this.elements = mapElements(element, {
      title: "[data-title]",
      artist: "[data-artist]",
      coverImage: "[data-cover]",
    });

    Airtable.configure({
      endpointUrl: "https://api.airtable.com",
      apiKey: process.env.AIRTABLE_API_KEY,
    });

    this.base = Airtable.base(process.env.AIRTABLE_BASE_ID);

    this.init();
  }

  async getNewToken() {
    // application/x-www-form-urlencoded parameters
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", process.env.SPOTIFY_REFRESH_TOKEN);

    const encodedSecret = Buffer.from(
      process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
    ).toString("base64");

    const headers = {
      Authorization: `Basic ${encodedSecret}`,
    };

    // fetch token with POST request
    const res = await axios.post(
      "https://accounts.spotify.com/api/token",
      params,
      { headers }
    );

    return res;
  }

  async updateToken() {
    // get new token from Spotify

    const res = await this.getNewToken();
    const resData = res.data;

    // Spotify tokens expire after 1 hour, so we set the expiry to 1 hour less than the actual expiry time.
    const created = Date.now();
    const token = {
      token: resData.access_token,
      expiry: (resData.expires_in - 300) * 1000,
      created,
    };

    // update global token variable
    this.token = token;

    // update Airtable
    await this.base("token").update([
      {
        id: "reclbFlyBFqatRm9L",
        fields: {
          ...token,
        },
      },
    ]);
  }

  async init() {
    try {
      const tokenValid = (token = {}) => {
        const now = Date.now();
        const expiry = Number(token.created) + Number(token.expiry);

        return now < expiry;
      };

      // get token data from Airtable
      const res = await this.base("token").select().firstPage();
      this.token = res[0].fields;

      // check if token exists and if it hasn't expired, if it has, then get a new one
      if (this.token && !tokenValid(this.token)) {
        await this.updateToken();
      }

      // if token doesn't exist, get a new one. This happens when there's no initial data in airtable
      if (!this.token) {
        await this.updateToken();
      }

      // once token has been fetched/updated, get now playing data
      const playing = await this.getNowPlaying();

      // this function updates the DOM with the now playing data
      this.setNowPlaying(playing);
    } catch (error) {
      if (error.response) {
        if (error.response.data.error.message === "The access token expired") {
          // if Spotify is being weird and the token has expired before it is actually suppsed to, get a new one.
          await this.updateToken();
          const playing = await this.getNowPlaying();
          this.setNowPlaying(playing);
        }
      }
    }
  }

  async getNowPlaying() {
    let songName = "";
    let isPlaying = false;
    let artistName = "";
    let url = "";
    let coverImageUrl = "";

    const headers = {
      Authorization: `Bearer ${this.token.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // fetch currently playing data.

    const res = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers }
    );

    // if there is no data, then the user is not playing anything, so we fetch the last played song instead.
    if (
      res.data.is_playing === false ||
      res.data.currently_playing_type !== "track"
    ) {
      const res = await axios.get(
        "https://api.spotify.com/v1/me/player/recently-played",
        { headers }
      );

      const playHistory = res.data.items;
      const recentTrack = playHistory[0].track;

      songName = recentTrack.name;
      isPlaying = false;
      artistName = recentTrack.artists[0].name;
      url = recentTrack.external_urls.spotify;
      coverImageUrl = recentTrack.album.images[0].url;
    } else {
      const track = res.data.item;

      songName = track.name;
      isPlaying = res.data.is_playing;
      artistName = track.artists[0].name;
      url = track.external_urls.spotify;
      coverImageUrl = track.album.images[0].url;
    }

    return {
      artistName,
      isPlaying,
      songName,
      url,
      coverImageUrl,
    };
  }

  // update DOM with now playing data
  setNowPlaying(playing) {
    const { artistName, songName, url, coverImageUrl } = playing;
    const { title, artist, coverImage } = this.elements;

    title.innerHTML = songName;
    title.href = url;
    artist.innerHTML = artistName;
    coverImage.innerHTML = `<img src="${coverImageUrl}" alt="${songName} by ${artistName}" />`;
  }
}
