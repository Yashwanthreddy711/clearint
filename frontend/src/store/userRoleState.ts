import { create } from "zustand"


type JoinState ={
    joinState:string,
    setUserState:(state:string)=>void
}

export const userRoleState= create<JoinState>((set)=>({
    joinState:"",
    setUserState:(state:string)=>set(()=>({
        joinState:state
    }))
}))