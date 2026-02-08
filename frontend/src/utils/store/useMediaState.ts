import {create} from 'zustand';

type MediaState = {
    localAudioTrack: MediaStreamTrack | null;
    localVideoTrack: MediaStreamTrack | null;

    setLocalTracks:(
        video : MediaStreamTrack | null,
        audio : MediaStreamTrack | null
    )=>void;

    resetMedia:()=>void;
}

export const useMediaState = create<MediaState>((set)=>({
    localAudioTrack:null,
    localVideoTrack:null,
    setLocalTracks:(video, audio)=>{
        set(()=>({
            localAudioTrack:audio,
            localVideoTrack:video
        }))
    },
    resetMedia:()=>{
        set(()=>({
            localAudioTrack:null,
            localVideoTrack:null
        }))
    }
}));
