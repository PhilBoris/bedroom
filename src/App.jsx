import React,{useState,useEffect} from 'react'
import GameCanvas from './game/GameCanvas'
import MusicUI from './music/MusicUI'
export default function App(){
  const [mode,setMode]=useState('game')
  const [insomniaSince,setInsomniaSince]=useState(null)
  useEffect(()=>{ if(mode==='insomnia') setInsomniaSince(Date.now()); else setInsomniaSince(null) },[mode])
  useEffect(()=>{
    if(mode==='insomnia'){
      try{ new Audio('/audio/gameover.wav').play() }catch(e){}
    }
  },[mode])

  useEffect(()=>{
    const id=setInterval(()=>{
      const el=document.querySelector('.sun-button')
      if(mode==='insomnia' && insomniaSince && (Date.now()-insomniaSince>60000)){ el?.classList.add('show') } else { el?.classList.remove('show') }
    },500); return()=>clearInterval(id)
  },[mode,insomniaSince])
  return(<div className={mode==='insomnia'?'app insomnia':'app'}>
    <header className="topbar"><h1>bedroom</h1></header>
    <main className="content">
      {mode==='game' && <GameCanvas onFound={()=>setMode('normal')} onInsomnia={()=>setMode('insomnia')} />}
      {mode!=='game' && <MusicUI insomnia={mode==='insomnia'} />}
    </main>
    <footer className="footer">flèches= bouger · espace= pause/play · b/tap= changer visuel · ⛶ plein écran</footer>
    <div className="sun-button"><img src="/sprites/sun.png" alt="sun" onClick={()=>{ try{ new Audio('/audio/reveil.wav').play() }catch(e){}; setMode('game') }} /></div>
  </div>)
}
