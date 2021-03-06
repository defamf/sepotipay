import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import ListArtist from "./components/ListArtist";
import CreatePlaylist from "./components/CreatePlaylist";
import { useDispatch, useSelector } from "react-redux";
import logo from "./images/sepotipaylogo.png";
import landing from "./images/landingimg.jpg";

function App() {
  const CLIENT_ID = "34b1eddc05a1468388c46ab4a1580abd";
  const REDIRECT_URI = "http://localhost:3000";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";
  const SCOPE = "playlist-modify playlist-modify-private user-read-private";

  const [token, setToken] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [selectedArtists, setSelectedArtists] = useState([]);
  const dispatch = useDispatch();
  const { tracksReducer } = useSelector((state) => state);

  const [userID, setUserID] = useState("");

  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");

    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))
        .split("=")[1];

      window.location.hash = "";
      window.localStorage.setItem("token", token);
    }
    console.log("token", token);
    setToken(token);
  }, []);

  useEffect(() => {
    async function getUserData() {
      await axios
        .get(`https://api.spotify.com/v1/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setUserID(response.data.id);
        });
    }
    if (token) {
      getUserData();
      getPlaylist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  const searchArtists = async (e) => {
    e.preventDefault();
    const { data } = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: searchKey,
        type: "track",
      },
    });

    let resultArtists = [...data?.tracks?.items];
    console.log(data?.tracks?.items);
    for (let i = 0; i < resultArtists.length - 1; i++) {
      for (let j = 0; j < selectedArtists.length - 1; j++) {
        if (resultArtists[i]?.id === selectedArtists[j]?.id) {
          resultArtists.splice(i, 1);
        }
      }
    }
    dispatch({
      type: "ADD_TRACK",
      payload: { res: [...selectedArtists, ...resultArtists] },
    });
  };

  const handleSelectArtist = (artistParams, isSelected) => {
    if (isSelected) {
      const arr = [...selectedArtists, artistParams];
      setSelectedArtists(arr);
    } else {
      let arr = [...selectedArtists];
      arr = arr.filter((item) => item?.id !== artistParams?.id);
      setSelectedArtists(arr);
    }
  };

  const getPlaylist = async () => {
    try {
      const response = await axios.get(
        "https://api.spotify.com/v1/me/playlists/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("playlist", response);
      setPlaylists(response?.data?.items);
    } catch (error) {
      console.error(error);
    }
  };

  const addSelectedToPlaylist = async (playListID) => {
    const data = [];
    console.log(selectedArtists);
    selectedArtists.map((item) => data.push(item?.uri));
    const headerConfig = {
      headers: {
        Authorization: "Bearer " + token,
      },
    };

    try {
      const response = await axios.post(
        `https://api.spotify.com/v1/playlists/${playListID}/tracks`,
        {
          uris: data,
        },
        headerConfig
      );
      console.log("", response);
      alert("Playlist Created");
    } catch (error) {
      console.error(error?.response);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="nav"></div>
        <img src={logo} className="App-logo" alt="logo" />
        <br />
        {token ? (
          <form onSubmit={searchArtists} className="Search">
            <input
              type="text"
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="Search"
              value={searchKey}
            />
            <button type={"submit"}>Search</button>
          </form>
        ) : (
          <>
            <img src={landing} className="App-landing" alt="lading" />
            <h6>/Music Website/</h6>
            <h1>
              Listen to your favorite <br /> music
            </h1>
            <p>
              Discover digital music and podcast from creators
              <br /> all over the world.
            </p>
          </>
        )}

        {!token ? (
          <a
            href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`}
          >
            <button className="btnLogin">Login</button>
          </a>
        ) : (
          <>
            <CreatePlaylist
              onSubmit={getPlaylist}
              userID={userID}
              token={token}
            />
            <h5>Your Playlist</h5>
            <div className="horizontal">
              {playlists?.map((item, index) => (
                <div className="card-playlist" key={index}>
                  <div>
                    <h5>{item?.name}</h5>
                    <span>{item?.description || "-"}</span>
                    <br />
                    <br />
                  </div>
                  <button
                    onClick={() => {
                      addSelectedToPlaylist(item?.id);
                    }}
                  >
                    Add selected song to this playlist
                  </button>
                  <br />
                  <br />
                </div>
              ))}
            </div>
            <div className="buttonLogOut">
              <br></br>
              <button onClick={logout}>Logout</button>
              <br></br>
            </div>
          </>
        )}

        <ListArtist
          artists={tracksReducer?.data}
          selectedArtists={selectedArtists}
          onSelected={handleSelectArtist}
        />
      </header>
    </div>
  );
}

export default App;
