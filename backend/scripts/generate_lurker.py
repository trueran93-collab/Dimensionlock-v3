"""Generate Lurker boss assets from new reference sheet."""
import asyncio, os, base64, urllib.request
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv()

REF_URL = 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/hzal4f2f_LURKER_1.png'
OUT = Path('/app/frontend/public/intro'); OUT.mkdir(parents=True, exist_ok=True)
SPR = Path('/app/frontend/public/sprites'); SPR.mkdir(parents=True, exist_ok=True)

ASSETS = [
    {
        'name': 'lurker',
        'out': OUT / 'lurker.png',
        'prompt': (
            "Using the ONE Lurker plague-doctor entity from this character reference sheet "
            "(tall slender humanoid in dark-mossy-green tattered robes, tall curved black hat with horns/spikes, "
            "long pointed bird-beak plague-doctor mask, spiky black feather ruff at the shoulders, "
            "bandolier across the chest with glowing vial pouches, leather belt with buckles, "
            "bandage-wrapped long arms, flowing long ribbon-trim cloak), "
            "render ONE clean cinematic full-body single-character portrait of THE LURKER for an anime horror game intro. "
            "Centered standing pose, slight forward menacing lean, anime horror art style, "
            "single character only (no character sheet, no duplicates, no text, no logos), "
            "solid black background, dramatic crimson and sickly green rim-lighting, "
            "thin red mist swirling around feet, vertical portrait aspect ratio, key-art quality."
        )
    },
    {
        'name': 'lurker_boss_sprite',
        'out': SPR / 'lurker_boss.png',
        'prompt': (
            "Create a clean 2D game sprite sheet (4 columns × 4 rows = 16 frames, transparent background, "
            "1024x1024 pixels, each cell 256x256) of the SAME Lurker plague-doctor entity from this reference. "
            "Anime game art style, consistent character design, clean line art with solid shading, "
            "no white background (use transparent or PURE BLACK background so it can be removed), "
            "each frame must show the FULL character centered in its cell. "
            "Row 1 (frames 0-3): IDLE breathing animation, hands at sides, robes drift slightly. "
            "Row 2 (frames 4-7): WALK CYCLE moving to the right, robes flow with motion. "
            "Row 3 (frames 8-11): ATTACK with right hand outstretched, releasing green poison cloud, robes flare. "
            "Row 4 (frames 12-15): SPECIAL ATTACK channeling crimson energy with both arms raised, "
            "menacing pose with red eyes glowing through plague mask. "
            "Maintain the dark-green tattered robe, spiky black feather collar, tall horned hat with beak mask, "
            "bandolier with glowing vials, and bandaged thin limbs in every frame."
        )
    }
]


def fetch_b64(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return base64.b64encode(r.read()).decode('utf-8')


async def gen(asset):
    api_key = os.getenv("EMERGENT_LLM_KEY")
    chat = LlmChat(api_key=api_key, session_id=f"lurker-{asset['name']}",
                   system_message="You are an expert anime game artist creating clean, consistent assets.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    print(f"Fetching ref for {asset['name']}…")
    ref = fetch_b64(REF_URL)

    print(f"Generating {asset['name']}…")
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=asset['prompt'], file_contents=[ImageContent(ref)])
    )
    if images:
        asset['out'].write_bytes(base64.b64decode(images[0]['data']))
        print(f"  ✓ Saved → {asset['out']}")
    else:
        print(f"  ✗ No image returned: {(text or '')[:200]}")


async def main():
    for a in ASSETS:
        try:
            await gen(a)
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
