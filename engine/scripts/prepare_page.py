#!/usr/bin/env python3
"""Build an offline HTML root. Trusted templates only; content is JSON, never HTML.

python engine/scripts/prepare_page.py --brand brands/lakesentry --template \
  universal-landscape.html --data brands/lakesentry/examples/demo-content.json \
  --out /tmp/lakesentry-page
"""
from __future__ import annotations

import argparse
import language_policy
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile
from urllib.parse import unquote, urlsplit

REPO = Path(__file__).resolve().parents[2]
SHORTS_SAFE_ZONE = REPO / 'formats/shorts/safe-zone.json'
UNIVERSAL = {"universal-landscape.html", "universal-vertical.html", "universal-square.html"}
SCENE_TEMPLATE = "video-scenes.html"


def safe_json(value):
    """JSON in an inline script: prevent closing tags and JS line separators."""
    return (json.dumps(value, ensure_ascii=True, allow_nan=False)
            .replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026"))


def local_asset(value, root):
    """Only local, root-contained asset paths (no URLs, queries or traversal)."""
    if not isinstance(value, str) or not value:
        raise ValueError("Asset path must be a non-empty string")
    url = urlsplit(value)
    decoded = unquote(url.path)
    path = PurePosixPath(decoded)
    if (url.scheme or url.netloc or url.query or url.fragment or "\\" in decoded
            or path.is_absolute() or ".." in path.parts or not path.parts
            or path.parts[0] != "assets"):
        raise ValueError(f"Asset must be inside assets/: {value}")
    target = (root / decoded).resolve()
    if not target.is_relative_to(root.resolve()) or not target.is_file():
        raise ValueError(f"Missing or escaping asset: {value}")
    return target


def _scene_asset_paths(data):
    for scene in data.get("scenes", []):
        if "src" in scene:
            yield scene["src"]


def _validate_scenes(data):
    if data.get("layout") != "scenes":
        raise ValueError("scene content requires layout=scenes")
    scenes = data.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        raise ValueError("scenes must contain at least one scene")
    previous_end = 0.0
    for scene in scenes:
        if not isinstance(scene, dict):
            raise ValueError("Each scene must be an object")
        required = {"id", "kind", "start", "end", "title"}
        if not required.issubset(scene):
            raise ValueError("Each scene requires id, kind, start, end and title")
        if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,79}", scene["id"]):
            raise ValueError("Scene id is invalid")
        if scene["kind"] not in {"title", "kpi", "steps", "screen", "cta"}:
            raise ValueError("Unsupported scene kind")
        start, end = scene["start"], scene["end"]
        if (isinstance(start, bool) or isinstance(end, bool) or
                not isinstance(start, (int, float)) or not isinstance(end, (int, float)) or
                not 0 <= start < end <= data["duration"]):
            raise ValueError("Scene times must be ordered within duration")
        if start < previous_end:
            raise ValueError("Scenes must be ordered and cannot overlap")
        previous_end = end
        for key, limit in (("eyebrow", 80), ("title", 180), ("body", 240),
                           ("value", 80), ("button", 80), ("alt", 160), ("disclosure", 120)):
            if key in scene and (not isinstance(scene[key], str) or len(scene[key]) > limit):
                raise ValueError(f"Scene {key} must be a string of at most {limit} characters")
        if "src" in scene:
            if scene["kind"] != "screen":
                raise ValueError("Only screen scenes may contain src")
            if (not isinstance(scene["src"], str) or not scene["src"].startswith("assets/") or
                    ".." in PurePosixPath(scene["src"]).parts):
                raise ValueError("Scene src must be a local assets/ path")
        if scene["kind"] == "screen" and "src" not in scene:
            raise ValueError("Screen scenes require src")
        if scene["kind"] == "steps":
            steps = scene.get("steps")
            if not isinstance(steps, list) or not 1 <= len(steps) <= 6:
                raise ValueError("Steps scene requires one to six steps")
            for step in steps:
                if (not isinstance(step, dict) or set(step) != {"title", "body"} or
                        not isinstance(step["title"], str) or not isinstance(step["body"], str) or
                        len(step["title"]) > 60 or len(step["body"]) > 140):
                    raise ValueError("Each step requires title and body")
        unknown = set(scene) - {"id", "kind", "start", "end", "eyebrow", "title", "body",
                                "value", "button", "src", "alt", "steps", "disclosure"}
        if unknown:
            raise ValueError("Unknown scene keys: " + ", ".join(sorted(unknown)))
        for key in ("eyebrow", "title", "body", "value", "button", "alt", "disclosure"):
            if key in scene:
                language_policy.check_prose(scene[key])
        for step in scene.get("steps", []):
            language_policy.check_prose(step["title"])
            language_policy.check_prose(step["body"])


def validate_data(data):
    if not isinstance(data, dict):
        raise ValueError("Content must be a JSON object")
    allowed = {"demo", "headline", "subtitle", "blocks", "footer", "duration", "layout", "format", "scenes", "disclosure"}
    if set(data) - allowed:
        raise ValueError("Unknown content keys: " + ", ".join(sorted(set(data) - allowed)))
    result = {"demo": True, "subtitle": "", "footer": "", "duration": 8, "blocks": [], "layout": "card", "format": "responsive"}
    result.update(data)
    if result["format"] not in {"responsive", "horizontal", "vertical", "square"}:
        raise ValueError("format must be responsive, horizontal, vertical or square")
    if "disclosure" in data and (not isinstance(data["disclosure"], str) or len(data["disclosure"]) > 120):
        raise ValueError("disclosure must be a string of at most 120 characters")
    if "disclosure" in data:
        language_policy.check_prose(data["disclosure"])
    if result.get("layout") == "scenes" or "scenes" in data:
        _validate_scenes(result)
        return result
    for key, limit in [("headline", 100), ("subtitle", 180), ("footer", 120)]:
        if not isinstance(result.get(key), str) or len(result[key]) > limit:
            raise ValueError(f"{key} must be a string of at most {limit} characters")
    if not result["headline"].strip():
        raise ValueError("headline cannot be empty")
    if not isinstance(result["demo"], bool):
        raise ValueError("demo must be a boolean")
    duration = result["duration"]
    if isinstance(duration, bool) or not isinstance(duration, (int, float)) or not 0 < duration <= 3600:
        raise ValueError("duration must be finite, positive and <= 3600 seconds")
    blocks = result["blocks"]
    if not isinstance(blocks, list) or len(blocks) > 3:
        raise ValueError("blocks must contain at most three objects")
    for block in blocks:
        if not isinstance(block, dict) or set(block) != {"title", "body"}:
            raise ValueError("Each block requires exactly title and body")
        for key, limit in [("title", 36), ("body", 100)]:
            if not isinstance(block[key], str) or len(block[key]) > limit:
                raise ValueError(f"Block {key} must be a string of at most {limit} characters")
    for key in ('headline', 'subtitle', 'footer'):
        language_policy.check_prose(result[key])
    for block in blocks:
        for value in block.values():
            language_policy.check_prose(value)
    return result


class ResourceCheck(HTMLParser):
    def __init__(self, root):
        super().__init__()
        self.root = root

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ("src", "poster", "srcset", "background", "data"):
            if key in attrs:
                if key == "srcset":
                    raise ValueError("srcset is not supported in offline templates")
                local_asset(attrs[key], self.root)
        if tag == "link" and attrs.get("href"):
            local_asset(attrs["href"], self.root)
        if tag in {"iframe", "object", "embed", "base"}:
            raise ValueError(f"Unsupported offline element: {tag}")


def check_resources(html, root):
    ResourceCheck(root).feed(html)
    # Validate CSS references as well as HTML attributes. Trusted scripts must not
    # fetch resources dynamically; this is not a JavaScript sandbox.
    if re.search(r"@import\b", html, re.I):
        raise ValueError("CSS @import is not allowed; bundle fonts/assets locally")
    for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", html, re.I):
        value = match.group(2)
        if not value.startswith("#"):
            local_asset(value, root)
    if re.search(r"(?:fetch\s*\(|XMLHttpRequest|WebSocket\s*\(|import\s*\()", html):
        raise ValueError("Dynamic network/resource loading is not supported")


def prepare_page(brand, template, output, data=None, extra_assets=None):
    """Return output/index.html. output must not exist, or be an empty directory.

    brand: brand.json or its directory. template: filename under brand/templates,
    or an explicit path to a trusted template. data: dict, JSON file, or None.
    Non-universal legacy templates deliberately reject content overrides.
    """
    brand_path = Path(brand).resolve()
    extra_assets = {str(k): Path(v).resolve() for k, v in (extra_assets or {}).items()}
    if brand_path.is_dir():
        brand_path /= "brand.json"
    brand_root = brand_path.parent
    config = json.loads(brand_path.read_text(encoding="utf-8"))
    language_policy.require_en(config.get('output_language', 'en'))
    source = Path(template)
    if not source.is_file():
        source = brand_root / "templates" / source
    source = source.resolve()
    html = source.read_text(encoding="utf-8")
    universal = source.name in UNIVERSAL
    scenes = source.name == SCENE_TEMPLATE
    if universal or scenes:
        if data is None:
            if scenes:
                raise ValueError("Scene template requires episode content with scenes")
            data = brand_root / "examples" / "demo-content.json"
        if isinstance(data, (str, Path)):
            data = json.loads(Path(data).read_text(encoding="utf-8"))
        content = validate_data(data)
        if scenes:
            for path in _scene_asset_paths(content):
                if path.startswith("assets/episode/"):
                    source_path = extra_assets.get(path)
                    if source_path is None or not source_path.is_file() or source_path.is_symlink():
                        raise ValueError(f"Missing episode asset: {path}")
                else:
                    local_asset(path, brand_root)
    else:
        if data is not None:
            raise ValueError("Legacy templates have fixed demo content; use universal-*.html for data overrides")
        content = {}
    # Validate brand-controlled asset references before inserting them in DOM/CSS.
    fonts = config.get("font_faces", config.get("fonts", []))
    if isinstance(fonts, list):
        for font in fonts:
            local_asset(font["src"], brand_root)
    for value in config.get("logo", {}).values():
        local_asset(value, brand_root)
    # Platform geometry is shared, never supplied by a product profile.
    format_policy = None
    format_css = ''
    if source.name == 'universal-vertical.html' or (scenes and content.get('format') == 'vertical'):
        format_policy = json.loads(SHORTS_SAFE_ZONE.read_text(encoding='utf-8'))
        width, height = format_policy['viewport']
        rect = format_policy['safe_rect']
        pad = format_policy['content_padding']
        if (width, height) != (1080, 1920) or not (
                0 <= rect['left'] < rect['right'] <= width
                and 0 <= rect['top'] < rect['bottom'] <= height
                and 0 <= pad < min(rect['right']-rect['left'], rect['bottom']-rect['top'])/2):
            raise ValueError('Invalid shared Shorts safe zone')
        margins = {'top': rect['top'] + pad, 'right': width - rect['right'] + pad,
                   'bottom': height - rect['bottom'] + pad, 'left': rect['left'] + pad}
        format_css = '\n:root {' + ''.join(
            f'--shorts-{key}: {value}px;' for key, value in margins.items()) + '}\n'
    css = subprocess.run(["node", str(REPO / "engine/render/brand_css.js"), str(brand_path)],
                         check=True, capture_output=True, text=True).stdout
    injection = ('<style id="generated-brand-css">\n' + css + format_css + '</style>\n'
                 '<script id="prepared-page-data">window.PAGE_DATA=' + safe_json(content)
                 + ';window.PAGE_BRAND=' + safe_json({"name": config.get("name", ""),
                                                     "logo": config.get("logo", {}),
                                                     "editorial": config.get("editorial", {})})
                 + ';window.PAGE_FORMAT=' + safe_json(content.get("format", "responsive")) + ';</script>')
    marker = "<!-- PREPARE_PAGE_HEAD -->"
    if marker in html:
        html = html.replace(marker, injection, 1)
    elif "<head>" in html:
        html = html.replace("<head>", "<head>\n" + injection, 1)
    else:
        raise ValueError("Template requires <head> or PREPARE_PAGE_HEAD marker")
    # No legacy ../ asset paths survive the output root.
    html = html.replace("../assets/", "assets/")
    check_resources(html, brand_root)
    dest = Path(output).resolve()
    if (dest == brand_root or dest.is_relative_to(brand_root)
            or brand_root.is_relative_to(dest) or source.is_relative_to(dest)):
        raise ValueError("Output must be separate from brand/template sources")
    if dest.exists() and (not dest.is_dir() or any(dest.iterdir())):
        raise ValueError("Output must be absent or an empty directory")
    # Reject symlinks, including links escaping assets/, instead of leaking files.
    assets = brand_root / "assets"
    if assets.is_symlink() or any(p.is_symlink() for p in assets.rglob("*")):
        raise ValueError("Brand assets must not contain symlinks")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="prepare-page-", dir=dest.parent) as temporary:
        staged = Path(temporary)
        shutil.copytree(assets, staged / "assets")
        for destination, source_path in extra_assets.items():
            if not destination.startswith("assets/episode/") or Path(destination).is_absolute() or ".." in PurePosixPath(destination).parts:
                raise ValueError("Episode assets must be under assets/episode/")
            destination_path = staged / destination
            destination_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, destination_path)
        (staged / "index.html").write_text(html, encoding="utf-8")
        (staged / "brand.json").write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
        (staged / "content.json").write_text(json.dumps(content, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        (staged / "build.json").write_text(json.dumps({"template": source.name, "legacy": not (universal or scenes),
            "layout": content.get("layout", "legacy"),
            "viewport": ({"horizontal": [1920, 1080], "vertical": [1080, 1920],
                          "square": [1080, 1080]}.get(content.get("format")) if scenes else
                         {"universal-landscape.html": [1920, 1080],
                          "universal-vertical.html": [1080, 1920],
                          "universal-square.html": [1080, 1080]}.get(source.name)),
            "format_policy": format_policy,
            "warning": "Editorial demo; not verified product UI or evidence of results."}, indent=2) + "\n", encoding="utf-8")
        if dest.exists():
            dest.rmdir()
        staged.rename(dest)
    return dest / "index.html"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--brand", required=True, help="Brand directory or brand.json")
    parser.add_argument("--template", required=True, help="Brand template filename or trusted HTML path")
    parser.add_argument("--data", help="JSON content file (universal templates only)")
    parser.add_argument("--out", "--output", dest="output", required=True, help="New/empty self-contained output root")
    args = parser.parse_args(argv)
    try:
        result = prepare_page(args.brand, args.template, args.output, args.data)
    except (ValueError, OSError, subprocess.CalledProcessError, KeyError) as error:
        parser.exit(2, f"error: {error}\n")
    print(json.dumps({"html": str(result), "root": str(result.parent)}))


if __name__ == "__main__":
    main()
