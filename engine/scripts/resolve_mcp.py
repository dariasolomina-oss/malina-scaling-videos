"""Tiny stdio client for the DaVinci Resolve MCP server (~/davinci-resolve-mcp), for when it isn't registered in Claude Code.
Run with the server's own venv:  ~/davinci-resolve-mcp/venv/bin/python resolve_mcp.py <cmd>
  list                       -> tool names + short descriptions
  schema <tool>              -> a tool's actions and input schema
  call <tool> '<json args>'  -> call a tool, print the result (images are saved as cap_N.* in the current directory)
  batch <file.json>          -> run [[tool, args, {"confirm": true, "stop_on_error": true}?], ...] in ONE server session
                                (confirm tokens only live inside one session, so destructive steps go through batch)
"""
import asyncio, json, os, sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

ROOT = os.path.expanduser('~/davinci-resolve-mcp')
ENV = dict(os.environ,
           RESOLVE_SCRIPT_API='/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting',
           RESOLVE_SCRIPT_LIB='/Applications/DaVinci Resolve/DaVinci Resolve.app/Contents/Libraries/Fusion/fusionscript.so',
           PYTHONPATH='/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting/Modules')
PARAMS = StdioServerParameters(command=f'{ROOT}/venv/bin/python', args=[f'{ROOT}/src/server.py'], env=ENV, cwd=ROOT)

_n = [0]
def show(res):
    import base64
    for c in res.content:
        if getattr(c, 'type', '') == 'image':
            _n[0] += 1
            p = os.path.join(os.getcwd(), f'cap_{_n[0]}.' + ('png' if 'png' in c.mimeType else 'jpg'))
            open(p, 'wb').write(base64.b64decode(c.data)); print('IMAGE saved', p)
        else:
            print(getattr(c, 'text', c))

async def main():
    cmd = sys.argv[1]
    async with stdio_client(PARAMS) as (r, w):
        async with ClientSession(r, w) as s:
            await s.initialize()
            if cmd in ('list', 'schema'):
                tools = (await s.list_tools()).tools
                if cmd == 'list':
                    for t in tools:
                        print(f'{t.name}: {(t.description or "").splitlines()[0][:160]}')
                else:
                    t = next(t for t in tools if t.name == sys.argv[2])
                    print(t.description); print(json.dumps(t.inputSchema, indent=1))
            elif cmd == 'call':
                show(await s.call_tool(sys.argv[2], json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}))
            elif cmd == 'batch':
                for entry in json.load(open(sys.argv[2])):
                    tool, args = entry[0], entry[1]
                    print(f'### {tool} {json.dumps(args)[:200]}')
                    res = await s.call_tool(tool, args)
                    txt = ''.join(getattr(c, 'text', '') for c in res.content)
                    if len(entry) > 2 and entry[2].get('confirm') and '"confirm_token"' in txt:
                        tok = json.loads(txt[txt.index('{'):]).get('confirm_token')
                        args = json.loads(json.dumps(args)); args.setdefault('params', {})['confirm_token'] = tok
                        print(f'### confirming {tool} with token')
                        res = await s.call_tool(tool, args)
                    show(res)
                    if len(entry) > 2 and entry[2].get('stop_on_error') and '"success": false' in ''.join(getattr(c, 'text', '') for c in res.content):
                        print('### stopping: step failed'); break

asyncio.run(main())
