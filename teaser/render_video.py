import os, sys, time, subprocess, shutil
from playwright.sync_api import sync_playwright

def render(mode="desktop", out_mp4="/Users/dabodestroyer/Desktop/Ater_Teaser_Videos/Ater_Teaser_Desktop_16x9.mp4"):
    print(f"--- Starting Render for {mode.upper()} ---")
    frames_dir = f"/tmp/ater_render_{mode}"
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir, exist_ok=True)

    html_file = "index.html" if mode == "desktop" else "mobile.html"
    file_url = f"file:///Users/dabodestroyer/code/Ater/teaser/{html_file}"
    width, height = (1920, 1080) if mode == "desktop" else (1080, 1920)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--allow-file-access-from-files', '--enable-font-antialiasing']
        )
        context = browser.new_context(
            viewport={'width': width, 'height': height},
            device_scale_factor=1
        )
        page = context.new_page()
        page.goto(file_url, wait_until='domcontentloaded')

        # Explicitly wait until all web fonts are loaded and verified
        page.wait_for_function("document.fonts.status === 'loaded' && document.fonts.check('58px Newsreader')")
        time.sleep(0.5)

        # Stop tick loop so we can deterministically step through time
        page.evaluate("isPlaying = false; if (typeof audioPlayer !== 'undefined') audioPlayer.pause(); render(0);")
        time.sleep(0.2)

        fps = 60
        duration = 32.0
        total_frames = int(fps * duration)
        print(f"Total frames to render: {total_frames} at {fps} fps ({width}x{height})")

        # Step through every frame deterministically and snapshot canvas as lossless PNG
        for i in range(total_frames):
            t = i / fps
            # Update currentTime and render frame t
            page.evaluate(f"currentTime = {t}; render({t});")
            data_url = page.evaluate("canvas.toDataURL('image/png')")
            import base64
            header, encoded = data_url.split(",", 1)
            img_data = base64.b64decode(encoded)
            frame_path = os.path.join(frames_dir, f"frame_{i:05d}.png")
            with open(frame_path, "wb") as f:
                f.write(img_data)

            if i % 180 == 0:
                print(f"[{mode}] Rendered frame {i}/{total_frames} ({int(i/total_frames*100)}%) - t={t:.2f}s")

        browser.close()

    print(f"Frames rendered cleanly. Multiplexing with audio using YouTube / TikTok broadcast specs...")
    audio_file = "/Users/dabodestroyer/code/Ater/teaser/joycelyns_dance_32s.mp3"
    
    # YouTube (16:9) and TikTok / Reels (9:16) broadcast standard:
    # - H.264 High Profile, Level 5.1
    # - yuv420p with standard color range (prevents flicker / gamma shift)
    # - 60 fps constant frame rate with standard keyframe interval (gop=120)
    # - High bitrate crisp audio (AAC-LC 320kbps 48kHz)
    # - +faststart (web optimized streaming moov atom at beginning)
    ffmpeg_cmd = [
        'ffmpeg', '-y',
        '-framerate', str(fps),
        '-i', os.path.join(frames_dir, 'frame_%05d.png'),
        '-i', audio_file,
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '16',
        '-profile:v', 'high',
        '-level:v', '5.1',
        '-pix_fmt', 'yuv420p',
        '-g', '120',
        '-keyint_min', '60',
        '-sc_threshold', '0',
        '-movflags', '+faststart',
        '-c:a', 'aac',
        '-b:a', '320k',
        '-ar', '48000',
        '-shortest',
        out_mp4
    ]
    subprocess.run(ffmpeg_cmd, check=True)
    print(f"SUCCESS: Exported {out_mp4} ({os.path.getsize(out_mp4) / 1024 / 1024:.2f} MB)")
    shutil.rmtree(frames_dir)

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "desktop"
    out = sys.argv[2] if len(sys.argv) > 2 else f"/Users/dabodestroyer/Desktop/Ater_Teaser_Videos/Ater_Teaser_{target.capitalize()}.mp4"
    render(target, out)
