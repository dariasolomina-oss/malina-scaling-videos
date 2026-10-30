const fs=require('fs');const path=require('path');const crypto=require('crypto');const {spawn}=require('child_process');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function fingerprint(root,settings) {
  root=fs.realpathSync(root);const files=[];
  function walk(dir){for(const name of fs.readdirSync(dir).sort()){const p=path.join(dir,name),s=fs.lstatSync(p);if(s.isSymbolicLink())throw new Error('Dependency root cannot contain symlinks: '+p);if(s.isDirectory())walk(p);else if(s.isFile())files.push([path.relative(root,p),hash(fs.readFileSync(p))]);}}
  walk(root);return hash(JSON.stringify({files,settings}));
}
function atomicJSON(file,obj){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(obj,null,2));fs.renameSync(tmp,file);}
function encoder(args){
  const child=spawn(process.env.FFMPEG||'ffmpeg',args,{stdio:['pipe','ignore','pipe']});let error,tail='';
  child.stderr.on('data',b=>{tail=(tail+b).slice(-8000);});
  // Always observe errors immediately (including EPIPE), even before finish() is called.
  child.stdin.on('error',e=>{error=e;});
  const done=new Promise(resolve=>{child.once('error',e=>{error=e;resolve(-1);});child.once('close',code=>resolve(code));});
  return {async write(buffer){if(error)throw error;if(child.exitCode!==null)throw new Error('ffmpeg exited: '+tail);
    await new Promise((resolve,reject)=>child.stdin.write(buffer,e=>e?reject(e):resolve()));if(error)throw error;},
    async finish(){child.stdin.end();const code=await done;if(error||code!==0)throw new Error(`ffmpeg failed (${code}): ${error||''} ${tail}`);},
    async abort(){child.stdin.destroy();child.kill('SIGTERM');await done;}};
}
async function runFFmpeg(args){const e=encoder(args);await e.finish();}
function validChunk(dir,c){const p=path.join(dir,c.file);return fs.existsSync(p)&&fs.statSync(p).size===c.bytes&&hash(fs.readFileSync(p))===c.sha256;}
module.exports={hash,fingerprint,atomicJSON,encoder,runFFmpeg,validChunk};
