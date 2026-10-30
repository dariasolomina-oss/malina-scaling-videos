const fs=require('fs');const path=require('path');const {execFileSync}=require('child_process');
const {openBrowser,serveHTML,ready}=require('./browser');
(async()=>{const [html,out]=process.argv.slice(2);if(!html||!out)throw new Error('Usage: thumbnail.js HTML OUT.jpg');let session,server;
try{server=await serveHTML(html);session=await openBrowser({context:{viewport:{width:2000,height:2000},storageState:process.env.STATE||undefined}});const p=await session.context.newPage();await ready(p,server.url);const {w,h}=await p.evaluate(()=>({w:document.body.offsetWidth,h:document.body.offsetHeight}));await p.setViewportSize({width:w,height:h});fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});await p.screenshot({path:out,type:'jpeg',quality:92});
const prev=path.join(path.dirname(path.resolve(html)),path.basename(out).replace(/\.jpg$/,'')+'-preview-320.jpg');execFileSync(process.env.FFMPEG||'ffmpeg',['-loglevel','error','-y','-i',out,'-vf','scale=320:-1',prev]);console.log('wrote',out,prev);
}finally{if(session)await session.close();if(server)await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
