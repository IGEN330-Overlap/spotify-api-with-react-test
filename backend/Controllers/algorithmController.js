const SpotifyWebApi = require("spotify-web-api-node");
require("dotenv").config();

let User = require("../Models/user.model");
let Group = require("../Models/group.model");
let Scripts = require("../scripts.js");

const client_id = process.env.CLIENT_ID; // Your client id
const client_secret = process.env.CLIENT_SECRET; // Your secret
const backend_url = process.env.BACKEND_URL;
const frontend_url = process.env.FRONTEND_URL;

const redirect_uri = backend_url + "callback"; // Your redirect uri

// instantiate spotifyApi object
var spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri,
});

/**
 * POST generate group top playlists
 *
 * @param {userIDs: [Strings], groupCode: String} req
 * @param {*} res
 */
exports.generateGroupsTopPlaylist = async (req, res) => {
  let usersTopTracks = []; // stores each users top tracks as a single item
  let usersTopArtists = []; // stores each users top artists as an item in the array
  let usersMusicalProfile = []; // stores each users musical proifles as single item
  spotifyApi.setRefreshToken(req.body.refreshToken); // set refresh token

  let userIDs = req.body.userIDs.map((id) => {
    return id;
  });

  let numUsers = userIDs.length; // keep track of number of users

  console.log("Users", userIDs); //debugging

  // Collect user top track data into top tracks array
  try {
    let data = await User.find({ userID: { $in: userIDs } });

    // Add each persons dataset to our master array
    for (x of data) {
      usersTopTracks.push(x.topTracks);
      usersMusicalProfile.push(x.musicalProfile);
      usersTopArtists.push(x.topArtists);
      // console.log(usersTopArtists.length)
    }
  } catch (err) {
    res.json({ message: "error on finding users", error: err });
  }

  console.log("top track profiles collected:", usersTopTracks.length); //debugging

  let masterSetTracks = []; //stores all top tracks as an item
  let masterSetArtists = []; //Array to store every artist from total group
  let findDuplicatesArr = []; //stores all track IDs as an item

  // put all the songs into one array, the master set
  for (x of usersTopTracks) {
    for (data of x) {
      masterSetTracks.push({
        data,
        identifier: data.trackName + " " + data.artistName,
      });
      findDuplicatesArr.push(data.trackName + " " + data.artistName);
    }
  }

  for (x of usersTopArtists) {
    for (data of x) {
      masterSetArtists.push(data.artistID);
    }
  }

  console.log("masterset length", masterSetTracks.length); //debugging

  /* Let's algorithm: This is making a 30 song playlist */

  // Count occurences of songs in master set
  let counts = findDuplicatesArr.reduce((a, c) => {
    a[c] = (a[c] || 0) + 1;
    return a;
  }, {});

  // find max count of common occurences in the masterID set
  let maxCountTracks = Math.max(...Object.values(counts));
  // uncover most commonly occuring ids and store to most Frequent tracks

  let playlistTracks = []; // Array to store songs to be added to playlist
  let attributeBasedSongs = []; // array to fill the remaining needed songs
  let duplicateBasedSongs = []; // array to store the tracks of our playlist
  let recommendations = []; // Array to store the recommendations

  /*
      NOTE: what happens if one person is in the group and tries to make a playlist?????
      algo off the top of my head would no likey, needs small adjustment at top of this block of ifs 
  */

  // debugging stuff
  let dummy = Object.keys(counts).filter((k) => counts[k] === maxCountTracks);

  // If there are at least 2 users and max count occurs in at least half the users
  if (numUsers <= 2 && maxCountTracks == 2) {
    // filters for songs that appear the same amount of times as maxCount
    let mostFrequentTracks = Object.keys(counts).filter(
      (k) => counts[k] === maxCountTracks
    );
    // Each nested if block in this set of if/elif statements does the same thing
    // add first 20 tracks if there are that many
    // else add however many songs there are that occur maxCount times

    if (mostFrequentTracks.length > 20) {
      duplicateBasedSongs = mostFrequentTracks.slice(0, 20);
      numSongs = 20;
    } else {
      duplicateBasedSongs = mostFrequentTracks;
      numSongs = mostFrequent;
      Tracks.length;
    }
    // If there are less than 7 users add if maxCount > (half the users rounded up)
  } else if (
    numUsers <= 7 &&
    maxCountTracks >= numUsers - Math.floor(numUsers / 2)
  ) {
    // A song must appear a minimum in 1/2 the users (half+1) if the num users in group is odd
    let numOccurencesOfSongsToAdd = numUsers - Math.floor(numUsers / 2);

    // filters for songs that appear the same amount of times as (numusers/2 +1) or more
    let mostFrequentTracks = Object.keys(counts).filter(
      (k) => counts[k] >= numOccurencesOfSongsToAdd
    );

    if (mostFrequentTracks.length > 20) {
      duplicateBasedSongs = mostFrequentTracks.slice(0, 20);
      numSongs = 20;
    } else {
      duplicateBasedSongs = mostFrequentTracks;
      numSongs = mostFrequentTracks.length;
    }
    // If there are more than 7 users add if maxCount > (half the users rounded down)
  } else if (
    numUsers > 7 &&
    maxCountTracks >= numUsers - Math.ceil(numUsers / 2)
  ) {
    // A song must appear a minimum in 1/2 the users (half-1) if the num users in group is odd
    let numOccurencesOfSongsToAdd = numUsers - Math.ceil(numUsers / 2);

    // filters for songs that appear the same amount of times as (numusers/2 -1) or more
    let mostFrequentTracks = Object.keys(counts).filter(
      (k) => counts[k] >= numOccurencesOfSongsToAdd
    );

    if (mostFrequentTracks.length > 20) {
      duplicateBasedSongs = mostFrequentTracks.slice(0, 20);
      numSongs = 20;
    } else {
      duplicateBasedSongs = mostFrequentTracks;
      numSongs = mostFrequentTracks.length;
    }
  } else {
    console.log("no frequent tracks added :(");
  }

  // console.log("Duplicate based songs", playlistTracks); //debugging

  // Using track sounds to add the rest of the songs
  // To implement (BETTER WAYS possibly)
  let groupsMusicalProfile = Scripts.calculateMusicalProfile(
    usersMusicalProfile
  );
  // console.log("groups musical profile", groupsMusicalProfile);

  // Remove all duplicates and add to the new array groupUniqueSet
  let groupUniqueSet = masterSetTracks.filter(
    (v, i, a) => a.findIndex((t) => t.identifier === v.identifier) === i
  );

  // TO IMPLEMENT, parameters to adjust which attribute has largest impacts
  let attributeAdjust = [1, 1, 1, 1];

  // calculate differences between each attribute and a song
  // add new prop "deltaFromGroup" which acts as an all in one ranking against the groups listening habits
  for (var i = 0; i < groupUniqueSet.length; i++) {
    groupUniqueSet[i]["deltaFromGroup"] =
      attributeAdjust[0] *
        Math.abs(
          groupUniqueSet[i].data.trackPopularity -
            groupsMusicalProfile.trackPopularity
        ) +
      attributeAdjust[1] *
        Math.abs(
          groupUniqueSet[i].data.danceability -
            groupsMusicalProfile.danceability
        ) +
      attributeAdjust[2] *
        Math.abs(groupUniqueSet[i].data.energy - groupsMusicalProfile.energy) +
      attributeAdjust[3] *
        Math.abs(groupUniqueSet[i].data.valence - groupsMusicalProfile.valence);
    //   Math.abs(x."SOME ATTRIBUTE" - groupsMusicalProfile."SOME ATTRIBUTE") ...
    // if (i < 5) {
    //     console.log(groupUniqueSet[i].deltaFromGroup);
    // }
  }

  // Sort the unique set by the deltaFromGroup to (lowest to highest)
  // Lowest is the bset
  let sortedTrackSet = groupUniqueSet.sort((a, b) => {
    return parseFloat(a.deltaFromGroup) - parseFloat(b.deltaFromGroup);
  });

  // Parses master set and adds the generate playlist tracks and the necessary info too
  // add the commonly occuring songs and the relevant props, can definitely be optimized
  var i,
    j = 0;
  for (i = 0; j < duplicateBasedSongs.length; i++) {
    // trackIDs match then add the corresponding data

    if (duplicateBasedSongs[j] == groupUniqueSet[i].identifier) {
      playlistTracks.push({
        trackName: groupUniqueSet[i].data.trackName,
        trackID: groupUniqueSet[i].data.trackID,
        imageUrl: groupUniqueSet[i].data.imageURL,
        linkURL: groupUniqueSet[i].data.linkURL,
        artistName: groupUniqueSet[i].data.artistName,
        identifier: groupUniqueSet[i].data.trackName + " " + groupUniqueSet[i].data.artistName,
      });
      // iterate to next track and reset the master to retraverse from left
      j++;
      i = 0;
    } else if (i >= groupUniqueSet.length) {
      break; // WE HAVE AN ERROR
    }
  }

  // purely trackIDs of duplicate songs for the recommendation seed
  let mostFrequentTracks = [];
  for (x of playlistTracks) {
    mostFrequentTracks.push(x.trackID);
  }

  // Count occurences of songs in master set of artists
  counts = masterSetArtists.reduce((a, c) => {
    a[c] = (a[c] || 0) + 1;
    return a;
  }, {});

  // get max count of artists
  let maxCountArtists = Math.max(...Object.values(counts));

  // filters for songs that appear the same amount of times as (numusers/2 +1) or more
  let mostFrequentArtists = Object.keys(counts).filter(
    (k) => counts[k] == maxCountArtists
  );

  console.log("max count tracks is: ", maxCountTracks);
  console.log("num tracks that max count: ", dummy.length);

  // console.log("frequent artists", mostFrequentArtists);
  // console.log("frequent tracks", mostFrequentTracks);

  // must have at least a single commonality to generate a viable seed based on the duplicates
  // otherwise use the best 3 matching songs to the group profile
  if (maxCountArtists == 1 || maxCountTracks == 1) {
    let sortedTrackSeed = []; // used to get seed for non duplicates
    for (var i = 0; i < 3; i++) {
      sortedTrackSeed.push(sortedTrackSet[i].data.trackID);
    }

    try {
      let data = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(data.body.access_token);

      try {
        // get spotify data based on the groups profile
        let data = await spotifyApi.getRecommendations({
          target_danceability: musicalProfile.danceability / 100,
          target_energy: musicalProfile.energy / 100,
          target_valence: musicalProfile.valence / 100,
          min_popularity: 50,
          seed_tracks: sortedTrackSeed.slice(0, 5),
        });

        // add the songs ensuring that their type is correct and that there is populated data
        for (x of data.body.tracks) {
          if (x.type == "track" && x.album.images.length != 0) {
            recommendations.push({
              trackName: x.name,
              trackID: x.id,
              imageURL: x.album.images[0].url,
              linkURL: x.external_urls.spotify,
              artistName: x.artists[0].name,
              identifier: x.name + " " + x.artists[0].name,
            });
          }
        }
      } catch (err) {
        res.json(err);
      }
    } catch (err) {
      res.json(err);
    }
  } else if (maxCountArtists != 1 || maxCountTracks != 1) {
    try {
      let data = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(data.body.access_token);

      try {
        // Get recommendations for the group
        let data;

        // select seed based on whichever provides more information
        // prioritize tracks seed as shown by the non inclusive conditional
        if (maxCountArtists > maxCountTracks) {
          data = await spotifyApi.getRecommendations({
            target_danceability: musicalProfile.danceability / 100,
            target_energy: musicalProfile.energy / 100,
            target_valence: musicalProfile.valence / 100,
            min_popularity: 50,
            seed_artists: mostFrequentArtists.slice(0, 5),
          });
        } else {
          data = await spotifyApi.getRecommendations({
            target_danceability: musicalProfile.danceability / 100,
            target_energy: musicalProfile.energy / 100,
            target_valence: musicalProfile.valence / 100,
            min_popularity: 50,
            seed_tracks: mostFrequentTracks.slice(0, 5),
          });
        }

        // add the songs ensuring that their type is correct and that there is populated data
        for (x of data.body.tracks) {
          if (x.type == "track" && x.album.images.length != 0) {
            recommendations.push({
              trackName: x.name,
              trackID: x.id,
              imageURL: x.album.images[0].url,
              linkURL: x.external_urls.spotify,
              artistName: x.artists[0].name,
              identifier: x.name + " " + x.artists[0].name,
            });
          }
        }
      } catch (err) {
        res.json(err);
      }
    } catch (err) {
      res.json(err);
    }
  }

  // Add all the recommendation songs from spotify until the playlist has 20 songs
  // To implement verify that we're adding a song that is not already in the playlist
  for (var i = 0; playlistTracks.length < 20; i++) {
    // console.log(i)
    // Add an attribute songs so long as they don't already exist in duplicates
    if (!playlistTracks.some((e) => e.identifier == recommendations[i].identifier)) {
      playlistTracks.push({
        trackName: recommendations[i].trackName,
        trackID: recommendations[i].trackID,
        imageUrl: recommendations[i].imageURL,
        linkURL: recommendations[i].linkURL,
        artistName: recommendations[i].artistName,
        identifier: recommendations[i].trackName + " " + recommendations[i].artistName,
      });
    } else if (i == recommendations.length) {
      break;
    }
  }

  // Add all the attribute based songs adding from lowest to highest until we satisfy our playlist size
  // To implement verify that we're adding a song that is not already in the playlist
  for (var i = 0; playlistTracks.length < 30; i++) {
    // console.log(i)
    // Add an attribute songs so long as they don't already exist in duplicates
    if (!playlistTracks.some((e) => e.identifier == sortedTrackSet[i].identifier)) {
      playlistTracks.push({
        trackName: sortedTrackSet[i].data.trackName,
        trackID: sortedTrackSet[i].data.trackID,
        imageUrl: sortedTrackSet[i].data.imageURL,
        linkURL: sortedTrackSet[i].data.linkURL,
        artistName: sortedTrackSet[i].data.artistName,
        identifier: sortedTrackSet[i].data.trackName + " " + sortedTrackSet[i].data.artistName,
      });
    } else if (i == sortedTrackSet.length) {
      break;
    }
  }

  //debugging
  console.log("duplicate based songs added: ", duplicateBasedSongs.length);
  console.log("attribute baesd songs: ", attributeBasedSongs.length);
  /* End of algorithm */

  // Create playlist object which will be uploaded to the group
  // Concatenate the duplicates and attribute based songs into one playlist
  // Remove identifier property
  playlistTracks.map((item) => {
    delete item.identifier;
    return item;
  });

  // playlist data to be passed to mongoDB
  playlist = {
    playlistName: req.body.playlistName,
    tracks: playlistTracks,
  };

  // Update playlist to the group
  // Note: no error is thrown when the groupCode is incorrect / dne
  try {
    await Group.updateOne(
      { groupCode: req.body.groupCode },
      { $addToSet: { playlists: playlist } }
    );
    res.json({
      message: "added playlist to the group",
      playlist: playlist,
    });
  } catch (err) {
    res.json({
      message: "Unable to add playlist to the group",
      error: err,
    });
  }
};

/**
 * POST Create the spotify playlist
 *
 * @param {*} req
 * @param {*} res
 */
exports.createSpotifyPlaylist = async (req, res) => {
  // Connect to spotify API using the owners refresh access token
  spotifyApi.setRefreshToken(req.body.refreshToken);

  let formattedTrackIds = [];
  let playlistName;

  // find the group and the corresponding playlistID (playlist object ID)
  try {
    let data = await Group.find(
      { groupCode: req.body.groupCode },
      { playlists: { $elemMatch: { _id: req.body.playlistID } } }
    );

    playlistName = data[0].playlists[0].playlistName; // Set playlist Name

    // Add the spotify track ids in the necessary format for adding to playlist
    for (x of data[0].playlists[0].tracks) {
      formattedTrackIds.push("spotify:track:" + x.trackID);
    }
  } catch (err) {
    res.json(err);
  }

  let playlistID; // variable to store playlist ID (spotify based)
  try {
    let data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body.access_token);

    try {
      // create spotify plyalist using the given playlist name
      // TODO adding descriptions???????
      let data = await spotifyApi.createPlaylist(playlistName, {
        description: "jams",
        public: true,
      });
      playlistID = data.body.id; // collect playlist id so we can add to it later
      console.log("playlist creation status code: ", data.statusCode);
    } catch (err) {
      res.json(err);
    }

    try {
      // Add the tracks to the spotify playlist
      let data = await spotifyApi.addTracksToPlaylist(
        playlistID,
        formattedTrackIds
      );
      console.log("playlist song addition status code: ", data.statusCode);

      res.json({
        message: "Successfully added playlist and the tracks to spotify",
        playlistID: playlistID,
        playlist: formattedTrackIds,
      });
    } catch (err) {
      res.json(err);
    }
    //TO IMPLEMENT adding an image cover to the playlist????
  } catch (err) {
    // console.log(err)
    res.json(err);
  }
};

/**
 * GET Method for retriveing a past playlist
 *
 * @param {*} req
 * @param {*} res
 */
exports.getGroupPlaylist = async (req, res) => {
  console.log("EMPTY");
  res.json({ m: "lmao" });
};
