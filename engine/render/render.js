// Deterministic renderer: see README.md for resumability and dependency contract.
const fs=require('fs');const path=require('path');
const {openBrowser,serveHTML,ready}=require('./browser');
const {hash,fingerprint,atomicJSON,encoder,runFFmpeg,validChunk}=require('./chunks');
function parse(argv){const [html,out,...a]=argv;if(!html||!out)throw new Error('Usage: render.js HTML OUTDIR [FPS | --test T...] [--video OUT.mp4 --fps 60 --chunk-frames 240 --resume]');
 const o={html:path.resolve(html),out:path.resolve(out),fps:60,chunkFrames:240,resume:false};
 if(a[0]==='--test'){o.times=a.slice(1).map(Number);if(!o.times.length||o.times.some(x=>!Number.isFinite(x)||x<0))throw new Error('Invalid still times');return o;}
 for(let i=0;i<a.length;i++){if(a[i]==='--video'){if(!a[i+1])throw new Error('--video requires path');o.video=path.resolve(a[++i]);}else if(a[i]==='--fps')o.fps=Number(a[++i]);else if(a[i]==='--chunk-frames')o.chunkFrames=Number(a[++i]);else if(a[i]==='--resume')o.resume=true;else if(i===0&&!a[i].startsWith('--'))o.fps=Number(a[i]);else throw new Error('Unknown option '+a[i]);}
 if(!Number.isFinite(o.fps)||o.fps<=0||!Number.isSafeInteger(o.chunkFrames)||o.chunkFrames<1)throw new Error('Invalid fps/chunk size');return o;}
async function main(argv){const o=parse(argv),w=Number(process.env.W||1920),h=Number(process.env.H||1080);
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<1||h<1)throw new Error('Invalid dimensions');
 if(o.video&&(w%2||h%2||process.env.ALPHA))throw new Error('MP4 requires even dimensions and no ALPHA');
 const root=path.resolve(process.env.HTML_ROOT||path.dirname(o.html));
 if(o.video&&(o.out===root||o.out.startsWith(root+path.sep)||o.video.startsWith(root+path.sep)))throw new Error('Video output and chunk directory must be outside HTML_ROOT');
 let session,server,active,stopping=false;const stop=()=>{stopping=true;};process.on('SIGTERM',stop);process.on('SIGINT',stop);
 try{server=await serveHTML(o.html);session=await openBrowser({context:{viewport:{width:w,height:h},deviceScaleFactor:1}});const p=await session.context.newPage();p.on('pageerror',e=>{throwPageErrors.push(e.message);});const throwPageErrors=[];
 await ready(p,server.url);const duration=await p.evaluate(()=>{if(typeof window.render!=='function')throw new Error('Missing window.render');return window.DURATION;});
 const draw=async t=>{await p.evaluate(async t=>{await window.render(t);},t);if(throwPageErrors.length)throw new Error(throwPageErrors.join('\n'));return p.screenshot(process.env.ALPHA?{type:'png',omitBackground:true,animations:'disabled'}:{type:'jpeg',quality:93,animations:'disabled'});};
 fs.mkdirSync(o.out,{recursive:true});
 if(o.times){for(const t of o.times){if(stopping)break;fs.writeFileSync(path.join(o.out,`t_${t.toFixed(2)}.${process.env.ALPHA?'png':'jpg'}`),await draw(t));}return;}
 if(!Number.isFinite(duration)||duration<=0)throw new Error('DURATION must be positive finite seconds');const total=Math.round(duration*o.fps);if(total<1)throw new Error('DURATION * fps must produce at least one frame');
 if(!o.video){for(let i=0;i<total&&!stopping;i++)fs.writeFileSync(path.join(o.out,`f_${String(i).padStart(5,'0')}.${process.env.ALPHA?'png':'jpg'}`),await draw(i/o.fps));return;}
 const settings={html:path.relative(root,o.html),fps:o.fps,chunkFrames:o.chunkFrames,w,h,duration,codec:'libx264-crf18-yuv420p',version:1,playwright:require('playwright/package.json').version,browser:session.browser.version(),cacheKey:process.env.RENDER_CACHE_KEY||''};
 const inputHash=fingerprint(root,settings),mf=path.join(o.out,'manifest.json');let m={version:1,inputHash,settings,total,chunks:[]};
 if(o.resume&&fs.existsSync(mf)){m=JSON.parse(fs.readFileSync(mf));if(m.version!==1||m.inputHash!==inputHash)throw new Error('Resume input/settings mismatch; use a fresh output directory or omit --resume');}
 if(!o.resume)atomicJSON(mf,m);
 for(let start=0;start<total&&!stopping;start+=o.chunkFrames){const count=Math.min(o.chunkFrames,total-start),file=`chunk_${String(start).padStart(9,'0')}.mp4`;const old=m.chunks.find(c=>c.start===start&&c.count===count&&c.file===file);
 if(old&&validChunk(o.out,old))continue;
 const dest=path.join(o.out,file),tmp=dest+'.partial.mp4';active=encoder(['-y','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(o.fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-frames:v',String(count),tmp]);
 let complete=true;for(let i=0;i<count;i++){if(stopping){complete=false;break;}await active.write(await draw((start+i)/o.fps));}
 if(!complete){await active.abort();active=null;fs.rmSync(tmp,{force:true});break;}
 await active.finish();active=null;fs.renameSync(tmp,dest);m.chunks=m.chunks.filter(c=>c.start!==start);m.chunks.push({start,count,file,bytes:fs.statSync(dest).size,sha256:hash(fs.readFileSync(dest))});m.chunks.sort((a,b)=>a.start-b.start);atomicJSON(mf,m);console.log(JSON.stringify({completedFrames:start+count,total,inputHash}));}
 if(stopping){process.exitCode=143;return;}
 if(fingerprint(root,settings)!==inputHash)throw new Error('Inputs changed during rendering; final video not published');
 const list=path.join(o.out,'concat.txt');fs.writeFileSync(list,m.chunks.map(c=>`file '${path.join(o.out,c.file).replace(/'/g,"'\\''")}'`).join('\n')+'\n');fs.mkdirSync(path.dirname(o.video),{recursive:true});const final=o.video+'.partial.mp4';await runFFmpeg(['-y','-loglevel','error','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',final]);if(stopping){process.exitCode=143;return;}fs.renameSync(final,o.video);console.log('wrote',o.video);
 }finally{if(active)await active.abort();if(session)await session.close();if(server)await server.close();process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);if(stopping)process.exitCode=143;}}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.stack||e);process.exitCode=1;});
module.exports={parse,main};
