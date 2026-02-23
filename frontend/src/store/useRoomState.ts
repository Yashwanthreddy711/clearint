import { create } from "zustand"


type RoomState ={
    roomId:string | undefined,
    setRoomId:(state:string | undefined)=>void
}

export const userRoomState= create<RoomState>((set)=>({
    roomId:"",
    setRoomId:(state:string | undefined)=>set(()=>({
        roomId:state
    }))
}))