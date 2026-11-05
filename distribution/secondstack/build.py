#!/usr/bin/env python3
"""Build a candidate Agent skill and product knowledge documents from local source."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[2]
VERSION = '1.0.0-candidate.1'
PRODUCTS = {'lakesentry': 'LakeSentry', 'antares': 'Antares', 'secondstack': 'SecondStack', 'alchemist': 'Alchemist'}


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + '\n', encoding='utf-8')


def dump(path, data):
    write(path, json.dumps(data, indent=2, ensure_ascii=True))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def replace_required(path, old, new):
    text = path.read_text()
    if old not in text:
        raise ValueError(f'Expected source contract changed: {path.name}: {old[:50]}')
    write(path, text.replace(old, new))


def archive(root, target):
    # Stable archive entries; do not carry workstation timestamps or permissions.
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in sorted(root.rglob('*')):
            if p.is_file():
                info = zipfile.ZipInfo(p.relative_to(root).as_posix(), (2026, 11, 5, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                z.writestr(info, p.read_bytes())


def build(output):
    output = Path(output).resolve()
    if output.exists():
        raise ValueError('Output must not already exist')
    if output == ROOT or ROOT.is_relative_to(output) or output.is_relative_to(ROOT/'engine') or output.is_relative_to(ROOT/'brands'):
        raise ValueError('Output must be separate from source library')
    output.mkdir(parents=True)
    skill = output/'skill'
    runtime = skill/'runtime'
    source = ROOT
    if any(p.is_symlink() for p in source.rglob('*') if '.git' not in p.parts):
        raise ValueError('Symlink in source distribution inputs')
    # Allowlisted source directories and types; no episodes, state or authentication.
    for folder, suffixes in [('engine', {'.py', '.sh', '.js', '.json'}), ('schemas', {'.json'}),
                             ('formats', {'.json', '.png', '.md'})]:
        for p in (source/folder).rglob('*'):
            if p.is_symlink():
                raise ValueError('Symlink in source library')
            if p.is_file() and p.suffix in suffixes and not any(x in p.parts for x in ('node_modules', '__pycache__')):
                dest = runtime/p.relative_to(source)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(p, dest)
    shutil.copytree(source/'templates', runtime/'templates')
    for slug, name in PRODUCTS.items():
        src = source/'brands'/slug
        dest = runtime/'brands'/slug
        shutil.copytree(src/'assets', dest/'assets')
        for namefile in ('universal-landscape.html', 'universal-vertical.html'):
            write(dest/'templates'/namefile, (src/'templates'/namefile).read_text())
        shutil.copytree(src/'examples', dest/'examples')
        config = json.loads((src/'brand.json').read_text())
        # These paths are replaced by Collection routing, not dangling local files.
        config['product'].pop('brief', None)
        config['product'].pop('source_registry', None)
        config['product']['knowledge_collection'] = name + ' Product Knowledge'
        dump(dest/'brand.json', config)
        if slug == 'lakesentry':
            visual = '''# LakeSentry visual rules

Use the current official brandkit: https://lakesentry.io/brandkit/ . The installed
brand.json supplies build colors, font faces and logo paths. Use Outfit headings,
Plus Jakarta Sans body/UI, and a system mono stack for code. Use original supplied
logos with clear space; do not redraw, recolor or retype the lockup. Prefer light,
calm technical layouts. No neon, glow, gradient text or panic imagery. Review actual
frames at phone size. Platform geometry comes from runtime/formats/shorts/.

Universal templates are editorial cards, not verified product UI. Keep disclosures.
Real walkthroughs need authorized dated capture and approved scripts. Do not infer
product features, prices or savings from an illustration. No background music by
default; sound effects require a suitable approved plan and license checks. Voice
is an explicit intake choice. Historical per-video style experiments are not current
production requirements. Review actual speech, captions and final media.

Assets retain their source/license records under assets/. Historical extra font and
sound files may be present; presence is not permission to override current styling.
'''
        else:
            visual = (src/'style-guide.md').read_text()
        write(dest/'style-guide.md', visual)
        write(dest/'templates/README.md', '''# Editorial templates
Use only the two universal layouts through prepare_page.py. Supply approved JSON;
examples are synthetic layout fixtures, not product facts. Read the skill research
reference and the selected product Collection. Fixed historical demos and covers
are not included. New scene types require separately prepared trusted templates;
these layouts are not an arbitrary storyboard generator.''')
        collection = output/'collections'/slug
        brief = (src/'product.md').read_text()
        if slug == 'lakesentry':
            brief = brief.split('## Provenance from the original main branch')[0]
            brief = brief.replace('Machine-readable reading/discovery log: [sources.json](sources.json).',
                'See the companion Source Registry document in this Collection.')
            brief = brief.replace('using `templates/research.md`', 'using the installed research template')
        else:
            brief = brief.split('## Production')[0]
        brief = brief.replace('[sources.json](sources.json)', 'Source Registry document')
        brief = brief.replace('`sources.json`', 'the companion Source Registry document')
        brief = brief.replace('[style-guide.md](style-guide.md)', 'the installed visual guide')
        brief = brief.replace('public Git', 'shared resources').replace('into Git', 'into shared resources')
        write(collection/'product-overview.md', f'''# {name} Product Knowledge

Knowledge export: {VERSION}. This is a dated reference summary, not a claim of
current feature execution. Retain the original review dates and evidence limits.
Read official topic sources before factual scripts. Source documents may be stale;
resolve material gaps and conflicts before production.

{brief}''')
        registry = json.loads((src/'sources.json').read_text())
        registry.pop('baseline_git_commit', None)
        # Preserve all factual status/provenance, but do not carry obsolete operating directions.
        registry_text = json.dumps(registry, indent=2, ensure_ascii=True).replace('public Git', 'shared resources').replace('into Git', 'into shared resources').replace('public repository', 'shared resources')
        write(collection/'source-registry.md', f'''# {name} Source Registry

Knowledge export: {VERSION}. Statuses and dates below describe historical checks,
not reading in the current run. A discovered URL is not verified feature evidence.
Select topic-relevant entries; log actual evidence in the episode RESEARCH.md.
Optional editorial sources do not grant access or authorize actions.

```json
{registry_text}
```
''')
    # Runtime-only adaptations. Approval and byte-binding routines remain intact.
    path = runtime/'engine/scripts/pipeline.py'
    replace_required(path, "state['branch'] = dict(name='ep/'+slug+'/'+episode_id, language='en', format=format)",
        f"state['episode_metadata'] = dict(product=slug, language='en', format=format, toolkit_version='{VERSION}')")
    replace_required(path, '    # This is a local branch descriptor, not a git operation.\n', '')
    replace_required(path, "state['pipeline'] = dict(brand=str(brand), product=slug, format=format, duration=duration, voice=voice)",
        f"state['pipeline'] = dict(brand=str(brand), product=slug, format=format, duration=duration, voice=voice, toolkit_version='{VERSION}')")
    replace_required(path, "    state = episode.create(root, episode_id, name + ' demo', 'en')",
        "    if root.resolve() == REPO or root.resolve().is_relative_to(REPO):\n        raise ValueError('Episode outputs must be outside the runtime library')\n    state = episode.create(root, episode_id, name + ' demo', 'en')")
    for name in ('pipeline.py', 'prepare_page.py'):
        p = runtime/'engine/scripts'/name
        write(p, p.read_text().replace('REPO', 'RUNTIME_ROOT'))
    p = runtime/'engine/scripts/episode.py'
    replace_required(p, "for section in ('metadata', 'branch'):", "for section in ('metadata', 'episode_metadata'):")
    replace_required(p, "    language_policy.require_en(state.get('language'))", "    if 'branch' in state:\n        raise ValueError('Legacy episode state requires its original compatible toolkit; no automatic migration')\n    language_policy.require_en(state.get('language'))")
    schema = runtime/'schemas/episode.schema.json'
    data = json.loads(schema.read_text())
    data['properties']['episode_metadata'] = data['properties'].pop('branch')
    dump(schema, data)
    # Remove obsolete asset-location examples from an optional utility.
    p = runtime/'engine/scripts/mix_events.py'
    write(p, p.read_text().replace('_assets', 'brand assets').replace('../../brand assets', 'path/to/approved-assets'))
    for name in ('brief.md', 'research.md', 'script.md'):
        write(runtime/'templates'/name, (ROOT/'distribution/secondstack/content/templates'/name).read_text())
    # Operational references are authored specifically for an installed library.
    for p in (ROOT/'distribution/secondstack/content/references').glob('*.md'):
        write(skill/'references'/p.name, p.read_text())
    write(skill/'SKILL.md', (ROOT/'distribution/secondstack/content/SKILL.md').read_text())
    write(output/'agent-instructions.txt', (ROOT/'distribution/secondstack/content/agent-instructions.txt').read_text())
    write(output/'UPLOAD.md', (ROOT/'distribution/secondstack/content/UPLOAD.md').read_text())
    write(skill/'verify.py', (ROOT/'distribution/secondstack/content/verify.py').read_text())
    # Retain production dependency declarations, not dependency installations.
    shutil.copy2(ROOT/'requirements-s2.txt', runtime/'requirements-s2.txt')
    manifest = {'version': VERSION, 'language':'en', 'status':'candidate_not_installed',
        'products': PRODUCTS, 'requirements': ['Python >=3.10', 'Node/npm', 'FFmpeg/ffprobe', 'compatible Chromium or authorized CDP'],
        'files': {p.relative_to(skill).as_posix(): digest(p) for p in sorted(skill.rglob('*')) if p.is_file()}}
    dump(skill/'manifest.json', manifest)
    archive(skill, output/'video-production-toolkit.zip')
    archive(output/'collections', output/'product-collections.zip')
    dump(output/'delivery-manifest.json', {'version':VERSION, 'artifacts':{
        p.name: {'sha256':digest(p), 'bytes':p.stat().st_size} for p in sorted(output.iterdir()) if p.is_file()}})
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    print(build(args.out))


if __name__ == '__main__':
    main()
