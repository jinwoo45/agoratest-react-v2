import { useEffect, useRef, useState } from "react";
import "./App.css";
import AgoraVideoPlayer from "./components";
import {
  showJoinedMessage,
  createMicrophoneAudioTrack,
  createCameraVideoTrack,
} from "./utils/utils";
import AgoraRTC from "agora-rtc-sdk-ng";
import axios from "axios";
import { WhiteWebSdk } from "white-web-sdk";
import { Fastboard } from "@netless/fastboard";
import { Excalidraw } from "@excalidraw/excalidraw";

let client = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});

function MyApp() {
  const videoRef = useRef(null);
  const whiteboardRef = useRef(null);
  const whiteWebSdk = new WhiteWebSdk({
    appIdentifier: "9Ng7wEDJEe6RXJVdJ0JbxQ/VEMQu35dhsiH6A",
    region: "us-sv",
  });
  const [videoTrack, setVideoTrack] = useState(null);
  const [audioTrack, setAudioTrack] = useState(null);
  const [screenVideoTrack, setScreenVideoTrack] = useState(null);
  const [screenAudioTrack, setScreenAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [localUid, setLocalUid] = useState("");
  const [joined, setJoined] = useState(false);
  const subscribe = async (user, mediaType) => {
    await client.subscribe(user, mediaType);
  };
  // const initTracks = async () => {
  //   const tracks = await Promise.all([
  //     createMicrophoneAudioTrack(),
  //     createCameraVideoTrack(),
  //   ]);
  //   setAudioTrack(tracks[0]);
  //   setVideoTrack(tracks[1]);
  //   return tracks;
  // };
  const handleUserPublished = async (user, mediaType) => {
    const id = user.uid;
    await subscribe(user, mediaType);
    setRemoteUsers((prev) => ({
      ...prev,
      [id]: user,
    }));
  };

  /*
   * Remove the user specified from the channel in the local interface.
   *
   * @param  {string} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to remove.
   */
  const handleUserUnpublished = (user, mediaType) => {
    if (mediaType === "video") {
      const id = user.uid;
      setRemoteUsers((pre) => {
        delete pre[id];
        return {
          ...pre,
        };
      });
    }
  };
  const join = async () => {
    try {
      const tracks = await initTracks();
      const options = {
        appId: "72d384119c5a41d691d14518c9ff8bff",
        token: "",
        channel: "1",
        uid: null,
      };
      // Add event listeners to the client.
      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);
      // Join a channel
      options.uid = await client.join(
        options.appId,
        options.channel,
        options.token || null,
        options.uid || null
      );
      setLocalUid(options.uid);

      await client.publish(tracks);

      setJoined(true);
    } catch (error) {
      console.error(error);
    }
  };

  const initTracks = async () => {
    const tempAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    setAudioTrack(tempAudioTrack);
    const tracks = await AgoraRTC.createScreenVideoTrack(
      {
        encoderConfig: "720p",
      },
      "auto"
    );
    if (tracks instanceof Array) {
      setScreenVideoTrack(tracks[0]);
      setScreenAudioTrack(tracks[1]);
      tracks[0].on("track-ended", handleTrackEnded);
      return [tempAudioTrack, ...tracks];
    } else {
      setScreenVideoTrack(tracks);
      tracks.on("track-ended", handleTrackEnded);
      return [tempAudioTrack, tracks];
    }
  };

  const handleTrackEnded = (e) => {
    if (screenVideoTrack) {
      screenVideoTrack.close();
      setScreenVideoTrack(null);
    }
    if (screenAudioTrack) {
      screenAudioTrack.close();
      setScreenAudioTrack(null);
    }
    if (audioTrack) {
      audioTrack.close();
      setAudioTrack(null);
    }
  };
  useEffect(() => {
    startCamera();
    // initTracks();
    initAgora();
    join();
  }, []);

  const initAgora = async () => {
    const agoraResult = await requestAgora();
    const roomToken = await generateRoomToken(agoraResult.uuid);

    const joinRoomParams = {
      uuid: agoraResult.uuid,
      uid: "jinwoo",
      roomToken: roomToken,
    };
    console.log("joinRoomParams", joinRoomParams);
    requestWhiteBoard(joinRoomParams);
  };

  const requestAgora = async () => {
    const config = {
      method: "post",
      url: "https://api.netless.link/v5/rooms",
      headers: {
        token:
          "NETLESSSDK_YWs9UGNPRm9NRDBVVkcyUDJrUCZub25jZT0zYjcxNWRiMC00MGNlLTExZWUtOTE1Yy05NTVkMjc0MjViYzUmcm9sZT0wJnNpZz1hZGYzNGNiM2RlYmEyYmRmNmZkODZjNjQwZGQ4MGIxMmI2YjYxN2EwYjE0MGI0MzIzMTlmMmE4ZWRjN2E1Yzc5",
        "Content-Type": "application/json",
        region: "us-sv",
      },
      data: {
        isRecord: false,
      },
    };
    try {
      const res = await axios(config);
      return res.data;
    } catch (e) {
      console.log(e);
    }
  };

  const generateRoomToken = async (roomUuid) => {
    const config = {
      method: "POST",
      // Replace <Room UUID> with the uuid of your room
      url: `https://api.netless.link/v5/tokens/rooms/${roomUuid}`,
      headers: {
        token:
          "NETLESSSDK_YWs9UGNPRm9NRDBVVkcyUDJrUCZub25jZT0zYjcxNWRiMC00MGNlLTExZWUtOTE1Yy05NTVkMjc0MjViYzUmcm9sZT0wJnNpZz1hZGYzNGNiM2RlYmEyYmRmNmZkODZjNjQwZGQ4MGIxMmI2YjYxN2EwYjE0MGI0MzIzMTlmMmE4ZWRjN2E1Yzc5",
        "Content-Type": "application/json",
        region: "us-sv",
      },
      data: { lifespan: 3600000, role: "admin" },
    };
    try {
      const res = await axios(config);
      console.log(res);
      console.log("룸토큰", res.data);
      return res.data;
    } catch (e) {
      console.log(e);
    }
  };

  const requestWhiteBoard = async (joinRoomParams) => {
    whiteWebSdk
      .joinRoom(joinRoomParams)
      .then(function (room) {
        room.bindHtmlElement(document.getElementById("whiteboard"));
        // whiteboardRef.current.appendChild(room.view);
      })
      .catch(function (err) {
        console.error(err);
      });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("카메라 접근에 실패했습니다: ", error);
    }
  };
  return (
    <div style={{ height: "100vh", background: "#d9d9d9" }}>
      <video
        style={{
          display: "block",
          margin: "auto",
          width: "200px",
          height: "200px",
        }}
        ref={videoRef}
        autoPlay
        playsInline
      />
      <AgoraVideoPlayer
        style={{ display: "none" }}
        videoTrack={screenVideoTrack}
        audioTrack={screenAudioTrack}
      ></AgoraVideoPlayer>
      {/* <div
        id="whiteboard"
        style={{
          margin: "auto",
          width: "80%",
          height: "550px",
          border: "1px solid black",
        }}
      ></div> */}
      <div
        style={{
          margin: "auto",
          width: "90%",
          height: "650px",
          border: "1px solid black",
        }}
      >
        {/* <Excalidraw /> */}
        <iframe
          style={{
            width: "100%",
            height: "100%",
          }}
          src="https://demo.netless.link/whiteboard/joiner/fbb50e4040b111eea56cd9c09ca72490/us-sv"
        ></iframe>
      </div>
      {/* <Fastboard /> */}
    </div>
  );
}

export default MyApp;
