import subprocess
import os
import sys
import imageio_ffmpeg

def get_ffmpeg_exe():
    return imageio_ffmpeg.get_ffmpeg_exe()

def generate_tts_clip(text, output_wav):
    ps_script = f'''
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Zira Desktop")
$synth.Rate = 0
$synth.SetOutputToWaveFile("{output_wav}")
$synth.Speak(@'
{text}
'@)
$synth.Dispose()
'''
    ps_file = output_wav + ".ps1"
    with open(ps_file, "w", encoding="utf-8") as f:
        f.write(ps_script)
    
    subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", ps_file], check=True)
    if os.path.exists(ps_file):
        os.remove(ps_file)

def main():
    ffmpeg = get_ffmpeg_exe()
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    demo_dir = os.path.join(base_dir, "demo")
    input_video = os.path.join(demo_dir, "mini-checkout-demo.webm")
    output_video = os.path.join(demo_dir, "mini-checkout-demo-with-voice.mp4")

    if not os.path.exists(input_video):
        print(f"Error: Input video not found at {input_video}")
        sys.exit(1)

    print("1. Synthesizing voiceover narration clips using Windows Speech Engine...")
    
    # Scene voice segments with offset in milliseconds
    segments = [
        {
            "delay_ms": 600,
            "text": "Welcome to the Mini Checkout demonstration. Built with React and Playwright, this single page app features reactive calculations, form validation, and duplicate order prevention."
        },
        {
            "delay_ms": 5600,
            "text": "The store features two synthetic products: a Mechanical Keyboard at 75 dollars, and a Wireless Mouse at 25 dollars. The initial cart loads one of each."
        },
        {
            "delay_ms": 11200,
            "text": "Increasing the keyboard quantity to two dynamically recalculates the line total to 150 dollars, and the grand order total to 175 dollars."
        },
        {
            "delay_ms": 17200,
            "text": "Decrementing the wireless mouse removes it from the cart, dropping the total to 150 dollars. Clicking Add to Cart restores it."
        },
        {
            "delay_ms": 25200,
            "text": "Now testing edge cases. When all items are removed, attempting to place an order is blocked with a clear warning notice."
        },
        {
            "delay_ms": 33200,
            "text": "Next, form validation. Submitting without a customer name triggers an error, while preserving any entered email data."
        },
        {
            "delay_ms": 41000,
            "text": "For security, rapidly double clicking Place Order activates an immediate button lock, guaranteeing only one order is placed."
        },
        {
            "delay_ms": 46200,
            "text": "Order confirmed! A unique reference code is generated with an itemized summary and total amount paid."
        },
        {
            "delay_ms": 51200,
            "text": "Clicking Place Another Order resets state cleanly. All five automated browser tests pass at 100 percent."
        }
    ]

    temp_clips = []
    for idx, seg in enumerate(segments):
        clip_path = os.path.join(demo_dir, f"temp_clip_{idx}.wav").replace("\\", "/")
        print(f"   Generating segment {idx+1}/{len(segments)}...")
        generate_tts_clip(seg["text"], clip_path)
        temp_clips.append((clip_path, seg["delay_ms"]))

    print("2. Muxing video and synchronized voiceover into MP4 with FFmpeg...")
    
    # Build filter complex for ffmpeg to delay and mix all audio clips
    # Example: [0:a]adelay=600|600[a0]; [1:a]adelay=5600|5600[a1]; ... [a0][a1]...amix=inputs=9:dropout_transition=0[aout]
    filter_inputs = []
    ffmpeg_cmd = [ffmpeg, "-y", "-i", input_video]
    
    for clip_path, _ in temp_clips:
        ffmpeg_cmd.extend(["-i", clip_path])
        
    filter_parts = []
    for i, (_, delay_ms) in enumerate(temp_clips):
        # input index: video is 0, audio clips are 1..N
        clip_idx = i + 1
        filter_parts.append(f"[{clip_idx}:a]adelay={delay_ms}|{delay_ms}[a{i}]")
    
    mix_inputs = "".join([f"[a{i}]" for i in range(len(temp_clips))])
    filter_parts.append(f"{mix_inputs}amix=inputs={len(temp_clips)}:dropout_transition=0:normalize=0[aout]")
    
    filter_complex = ";".join(filter_parts)
    
    ffmpeg_cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_video
    ])

    print("   Running FFmpeg conversion...")
    res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("FFmpeg error:", res.stderr)
        sys.exit(1)

    print("3. Cleaning up temporary audio clips...")
    for clip_path, _ in temp_clips:
        if os.path.exists(clip_path):
            os.remove(clip_path)

    print(f"\n🎉 Success! Narrated video created: {output_video}")

if __name__ == "__main__":
    main()
