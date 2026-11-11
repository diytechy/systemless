"""Stage one private pilot scene without changing the installed pilot.

The reviewed recipe, decoded resource, checked route and owned assets stay
outside Git. This only prepares a browser QA copy; it does not accept a scene.
"""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha(path):
    with path.open("rb") as stream:
        digest = hashlib.sha256()
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def checked(pin, path=None):
    path = path or Path(pin["path"])
    if sha(path) != pin["sha256"]:
        raise ValueError(f"Pinned input changed: {path}")
    return path


def basename(value):
    if not isinstance(value, str) or value in (".", "..") or not re.fullmatch(r"[A-Za-z0-9_.-]+", value):
        raise ValueError(f"Invalid bundle filename: {value!r}")
    return value


def inventory(root):
    return {p.relative_to(root).as_posix(): sha(p) for p in sorted(root.rglob("*")) if p.is_file()}


def stage(recipe):
    baseline = Path(recipe["baseline"]).resolve(strict=True)
    qa = Path(recipe["output"]).resolve()
    if qa.exists() or qa == baseline or baseline in qa.parents:
        raise ValueError("QA output must be new and outside the installed pilot")
    marker = read(baseline / "private-pilot.json")
    old = inventory(baseline)
    if marker["id"] != "clockwerx-html5-pilot-v1" or old["assets/manifest.json"] != recipe["baselineManifestSHA256"]:
        raise ValueError("Unexpected baseline pilot")
    if marker["assets_manifest_sha256"] != old["assets/manifest.json"]:
        raise ValueError("Baseline marker mismatch")
    if any(old.get(name) != digest for name, digest in marker["source_files"].items()):
        raise ValueError("Baseline runtime marker mismatch")
    manifest = read(baseline / "assets/manifest.json")
    scenes = manifest["scenes"]
    scene = dict(recipe["scene"])
    ordinal = scene["ordinal"]
    if not isinstance(ordinal, int) or ordinal != len(scenes) + 1 or any(x["id"] == scene["id"] for x in scenes):
        raise ValueError("Expected one new sequential scene")
    config = read(checked(recipe["config"]))
    options = read(checked(config["options"]))
    data = read(checked(config["decoded"]))
    if options["ordinal"] != ordinal or options["title"] != scene["title"]:
        raise ValueError("Scene and board options differ")
    if "rawResource" in config and sha(checked(config["rawResource"])) != data["sha256"]:
        raise ValueError("Raw resource and decoded identity differ")
    literal = read(checked(recipe["literal"]))
    route = []
    for run in literal["inputRuns"]:
        count, inputs = run["count"], run["input"]
        if type(count) is not int or count < 1 or not isinstance(inputs, dict) or len(inputs) > 1:
            raise ValueError("Browser route requires positive runs and a single held action")
        action = next(iter(inputs), None)
        if inputs and (action not in ("swing", "flip", "bounce", "reverse") or inputs[action] is not True):
            raise ValueError("Unsupported browser input")
        route.append([count, action])
    if not route or sum(count for count, _ in route) != literal["updates"]:
        raise ValueError("Route and update count differ")
    runtime = Path(recipe["runtime"]).resolve(strict=True)
    frozen = read(checked(recipe["freeze"]))["files"]
    sources = {basename(f["name"]): f for f in frozen}
    if len(sources) != len(frozen) or not {"index.html", "app.mjs", "level.mjs", "round.mjs"} <= sources.keys():
        raise ValueError("Incomplete or duplicate source freeze")
    for name, pin in sources.items():
        checked(pin, runtime / name)
    if marker["source_files"].keys() - sources.keys():
        raise ValueError("An append freeze must retain the installed runtime filenames")
    assets = {row["name"]: row for row in manifest["files"]}
    additions = {basename(row["name"]): row for row in recipe.get("addAssets", [])}
    if assets.keys() & additions.keys() or len(additions) != len(recipe.get("addAssets", [])):
        raise ValueError("QA additions cannot replace or duplicate assets")
    for row in additions.values():
        checked(row)
    vector_additions = recipe.get("vectorAssets", {})
    if not isinstance(vector_additions, dict) or vector_additions.keys() & manifest.get("vectorAssets", {}).keys():
        raise ValueError("QA vector additions cannot replace existing artwork definitions")
    for definition in vector_additions.values():
        if not isinstance(definition, dict) or definition.get("file") not in additions:
            raise ValueError("New vector artwork must name a verified added asset")
    if scene.get("backdrop") and scene["backdrop"] not in (assets.keys() | additions.keys()):
        raise ValueError("Backdrop is not in the QA inventory")
    definition = {"ordinal": ordinal, "title": scene["title"], "data": data}
    for k, value in options.items():
        if k.startswith("allow") and value is True:
            definition[k[5].lower() + k[6:] + "Qualified"] = True
    for key, pin in config["profiles"].items():
        name = basename(recipe.get("profileNames", {}).get(key, Path(pin["path"]).name))
        checked(pin)
        if (assets.get(name) or additions.get(name) or {}).get("sha256") != pin["sha256"]:
            raise ValueError(f"Unlisted scene profile: {name}")
        definition[key + "File"] = name
    if "oilBounds" in config:
        definition["oilBounds"] = config["oilBounds"]
    if "bombRoutes" in config:
        definition["bombRoutes"] = read(checked(config["bombRoutes"]))
    scene.update(levelDefinition=definition, checkedRoute=route, qualification={"status": "ISOLATED_QA"})

    out = qa / "dist/clockwerx-html5"
    shutil.copytree(baseline, out)
    for path in (out / name for name in [*sources, "private-pilot.json", "assets/manifest.json"]):
        if path.exists():
            path.chmod(0o666)
    for name in sources:
        shutil.copy2(runtime / name, out / name)
    for name, row in additions.items():
        dst = out / "assets" / name
        shutil.copy2(Path(row["path"]), dst)
        manifest["files"].append({"name": name, "sha256": sha(dst), "bytes": dst.stat().st_size})
    scenes.append(scene)
    if vector_additions:
        manifest.setdefault("vectorAssets", {}).update(vector_additions)
    mp = out / "assets/manifest.json"
    write(mp, manifest)
    for k in ("functional_goal_verified", "actual_proof_receipt_sha256", "last_bounded_acceptance", "root_actual_proof_review_sha256"):
        marker.pop(k, None)
    marker.update(source_files={name: f["sha256"] for name, f in sources.items()},
                  assets_manifest_sha256=sha(mp), asset_count=len(manifest["files"]),
                  asset_bytes=sum((out / "assets" / row["name"]).stat().st_size for row in manifest["files"]),
                  scope=f"Private isolated QA through scene {ordinal}")
    write(out / "private-pilot.json", marker)
    staged = inventory(out)
    if any(staged.get(f"assets/{basename(row['name'])}") != row["sha256"] for row in manifest["files"]):
        raise ValueError("Staged asset inventory differs")
    if inventory(baseline) != old:
        raise ValueError("Baseline changed during staging")
    write(qa / "preparation-receipt.json", {
        "status": "ISOLATED_QA", "priorScenesExact": ordinal - 1, "priorAssetsExact": True,
        "sourceFreezeSHA256": recipe["freeze"]["sha256"], "literalSHA256": recipe["literal"]["sha256"],
        "assetCount": marker["asset_count"], "inventory": staged,
    })
    return out


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("recipe", type=Path)
    print(stage(read(parser.parse_args().recipe)))
