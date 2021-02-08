/**
 * Song class
 * See the class for the fields and constructor
 */
class Song {
    // Fields
    name; // String
    songID; // String, private field and cannot be modified
    popularity; // Number
    artist;
    artistID;
    danceability; // Number
    energy; // Number
    key; // Number
    loudness; // Number
    mode; // Number
    speechiness; // Number
    acousticness; // Number
    instrumentalness; // Number
    liveness; // Number
    valence; // Number
    tempo; // Number
    duration_ms; // Number
    time_signature; // Numbers
    type; // String
    imageURL;

    // Song constructor, Includes all the features of a song now 
    // TO IMPLEMENT: danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo, duration_ms, time_signature 
    constructor(name, songID, popularity, type, artist, artistID, imageURL){
        this.name = name;
        this.songID = songID;
        this.popularity = popularity;
        this.type = type;
        this.artist = artist;
        this.artistID = artistID;
        this.imageURL = imageURL
    };
    
    // -------- TESTER -------- //
    method; AddTrackFeatures(songID){

        spotifyApi.getAudioFeaturesForTrack(songID).then(
            (data) => {
                // Collect the features for each song
                // Note there's probably a better way to do it... hardcoded for now
                this.danceability = data.body['danceability'];
                this.energy = data.body['energy'];
                this.key = data.body['key'];
                this.loudness = data.body['loudness'];
                this.mode = data.body['mode'];
                this.speechiness = data.body['speechiness'];
                this.acousticness = data.body['acousticness'];
                this.instrumentalness = data.body['instrumentalness'];
                this.liveness = data.body['liveness'];
                this.valence = data.body['valence'];
                this.tempo = data.body['tempo'];
                this.duration_ms = data.body['duration_ms'];
                this.time_signature = data.body['time_signature'];
                },
            (err) => { done (err); }
        );
    }
}

module.exports = Song;