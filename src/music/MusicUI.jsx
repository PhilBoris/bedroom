import React,{useState,useEffect} from 'react'
import PlayerFullAuto from "./PlayerFullAuto";
export default function MusicUI({insomnia=false}){
  const [counts,setCounts]=useState(()=>{const s=localStorage.getItem('playCounts');return s?JSON.parse(s):[0,0,0,0,0,0]})
  const [activeIndex,setActive]=useState(null)
  const [speed,setSpeed]=useState(1)
  const [pitch,setPitch]=useState(0) // semitones
  const [bass,setBass]=useState(0)
  useEffect(()=>{localStorage.setItem('playCounts',JSON.stringify(counts))},[counts])
  const tracks=[
    {title:'jvais pas changer cqui s\'est passé',file:'/audio/track1.wav'},
    {title:"la barette qui fait des bulles",file:'/audio/track2.wav'},
    {title:'pq le temps il s\'arrete',file:'/audio/track3.wav'},
    {title:'la surface des océans',file:'/audio/track4.wav'},
    {title:'plus r à f',file:'/audio/track5.wav'},
    {title:'wizard',file:'/audio/track6.wav'}
  ]
  function handleSelect(i){
    if(tracks[i].file){ setCounts(c=>{const nc=[...c];nc[i]++;return nc}); setActive(i) }
  }
  return(<div style={{width:'100%',padding:'0 12px'}}>
    <div className="track-list">
      {tracks.map((t,i)=>(
        <div key={i} className="track" onClick={()=>handleSelect(i)}>
          <div className="title">{t.title}</div>
          <div className="meta">▶ {counts[i]}</div>
        </div>
      ))}
    </div>
    {activeIndex!==null && <PlayerFullAuto tracks={tracks} startIndex={activeIndex} onClose={()=>setActive(null)} insomnia={insomnia} speed={speed} pitch={pitch} bass={bass} onSpeedChange={setSpeed} onPitchChange={setPitch} onBassChange={setBass} />}
  </div>)
}
