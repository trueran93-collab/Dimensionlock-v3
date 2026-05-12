"""
Generate clean single-character cinematic images for Dimensionlock intro.
Uses Gemini nano-banana with reference sheets to produce single-figure cinematic portraits.
Run once: python /app/backend/scripts/generate_intro_chars.py
"""
import asyncio
import os
import base64
import urllib.request
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv()

OUT_DIR = Path('/app/frontend/public/intro')
OUT_DIR.mkdir(parents=True, exist_ok=True)

CHARACTERS = [
    {
        'name': 'master_death',
        'ref_url': 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/5iwshpfm_Illustration53-11.jpg',
        'prompt': (
            "Using the SINGLE main skeletal grim reaper character from this reference sheet, "
            "render ONE clean cinematic full-body portrait of Master Death. "
            "Tall slender skeleton in dark hooded robes wearing a tall witch's hat with green skull face, "
            "anime art style, single character only (no duplicates, no other characters, no character sheet, no text), "
            "centered standing pose, facing slightly toward the viewer, "
            "transparent or solid black background, dramatic teal rim-lighting, "
            "cinematic key-art quality, vertical portrait aspect ratio."
        )
    },
    {
        'name': 'flybutt',
        'ref_url': 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/7a3boklz_Illustration12_10-1.png',
        'prompt': (
            "Using the SINGLE cute anthropomorphic yellow housefly character from this reference sheet, "
            "render ONE clean cinematic full-body portrait of Flybutt. "
            "Big round yellow head with two large googly eyes, small transparent wings, six thin legs, "
            "chubby yellow body, anime / chibi art style, friendly expression, "
            "single character only (no duplicates, no other characters, no character sheet, no text), "
            "centered floating pose with wings spread, "
            "transparent or solid black background, warm golden rim-lighting, "
            "cinematic key-art quality, vertical portrait aspect ratio."
        )
    },
    {
        'name': 'lurker',
        'ref_url': 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/t6cwtfcm_result-1768706346582-4.png',
        'prompt': (
            "Using the SINGLE main lurker husk creature from this reference sheet, "
            "render ONE clean cinematic full-body portrait of The Lurker. "
            "Horrifying plague entity with pale-blue tentacled upper body and crimson dripping tendrils, "
            "multiple bleeding red eyes, dark gaping fanged maw, "
            "anime horror art style, ominous and menacing, "
            "single creature only (no duplicates, no character sheet, no text), "
            "centered standing pose, "
            "transparent or solid black background, crimson rim-lighting and dark mist, "
            "cinematic key-art quality, vertical portrait aspect ratio."
        )
    }
]


def fetch_b64(url: str) -> str:
    with urllib.request.urlopen(url, timeout=30) as resp:
        return base64.b64encode(resp.read()).decode('utf-8')


async def gen_one(char):
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY not set")
    chat = LlmChat(
        api_key=api_key,
        session_id=f"intro-{char['name']}",
        system_message="You are an expert anime concept artist."
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    print(f"Fetching reference for {char['name']}…")
    ref_b64 = fetch_b64(char['ref_url'])

    msg = UserMessage(
        text=char['prompt'],
        file_contents=[ImageContent(ref_b64)]
    )

    print(f"Generating image for {char['name']}…")
    text, images = await chat.send_message_multimodal_response(msg)
    print(f"  Got {len(images) if images else 0} image(s)")

    if images:
        img = images[0]
        out_path = OUT_DIR / f"{char['name']}.png"
        out_path.write_bytes(base64.b64decode(img['data']))
        print(f"  Saved → {out_path}")
    else:
        print(f"  ⚠ No image returned for {char['name']}: {text[:200] if text else '(no text)'}")


async def main():
    for c in CHARACTERS:
        try:
            await gen_one(c)
        except Exception as e:
            print(f"Error generating {c['name']}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
