from flask import Flask, request, jsonify, send_file
import requests
import json
import re
import os
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, concatenate_videoclips
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Config
API_KEY = "tlk_0ZEJZ8C13PPJ5P23HVHHD2ZVTCVY"
BASE_URL = "https://api.twelvelabs.io/v1.3"
UPLOAD_FOLDER = "uploads"
CLIPS_FOLDER = "clips"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CLIPS_FOLDER, exist_ok=True)

# Helper functions (from your script)

def parse_and_adjust_goal_ranges(input_str, min_duration=15, max_duration=15, target_duration=15):
    start_pattern = r"Start Time:\s*(\d+)s"
    end_pattern = r"End Time:\s*(\d+)s"
    start_times = list(map(int, re.findall(start_pattern, input_str)))
    end_times = list(map(int, re.findall(end_pattern, input_str)))
    adjusted_ranges = []
    for start, end in zip(start_times, end_times):
        duration = end - start
        if duration > max_duration:
            continue
        elif duration < min_duration:
            extra = target_duration - duration
            pad_before = extra // 2
            pad_after = extra - pad_before
            start = max(0, start - pad_before)
            end = start + target_duration
        adjusted_ranges.append((start, end))
    return adjusted_ranges

def string_to_array(text):
    text = text.strip()[1:-1]
    items = [item.strip().strip('"').strip("'") for item in text.split(",")]
    return items

def extract_catch_titles(text):
    marker = "Title Array ="
    if marker in text:
        text = text.split(marker, 1)[1]
    else:
        return []
    titles = string_to_array(text)
    return titles

def call_twelvelabs_api(video_id):
    data = {
        "video_id": video_id,
        "prompt": """Provide timestamps of all the 3 goals that were scored in this match in the format of start time to end time. 
        Also, act as a sports video editor and provide catch titles to be used for the clips when used as a part of match highlights video. Use the correct emojis in the title. The titles should be in a ready to copy paste array as Title Array = """,
        "temperature": 0.2
    }
    response = requests.post(
        f"{BASE_URL}/generate",
        json=data,
        headers={"x-api-key": API_KEY},
        stream=True
    )
    full_text = ""
    for line in response.iter_lines():
        if line:
            try:
                event = json.loads(line.decode("utf-8"))
                if event.get("event_type") == "text_generation":
                    full_text += event.get("text", "")
            except json.JSONDecodeError:
                pass
    return full_text

def trim_video_from_ranges(time_ranges, video_path, titles):
    os.makedirs(CLIPS_FOLDER, exist_ok=True)
    try:
        video = VideoFileClip(video_path)
    except Exception as e:
        return str(e)

    clip_paths = []
    for i, (start, end) in enumerate(time_ranges):
        if end > video.duration:
            continue
        clip = video.subclip(start, end)
        text = titles[i] if i < len(titles) else "Goal Highlight"
        txt_clip = TextClip(text, fontsize=48, color='white', bg_color='black')
        txt_clip = txt_clip.set_position(("center", "bottom")).set_duration(clip.duration)
        final_clip = CompositeVideoClip([clip, txt_clip])
        output_path = os.path.join(CLIPS_FOLDER, f"{i}.mp4")
        final_clip.write_videofile(output_path, codec="libx264", audio_codec="aac", verbose=False, logger=None)
        clip_paths.append(output_path)
    video.close()
    return clip_paths

def create_highlight_video(clips_dir, intro_path, outro_path, output_path="highlight.mp4"):
    try:
        intro_clip = VideoFileClip(intro_path)
        outro_clip = VideoFileClip(outro_path)
        clip_files = sorted(
            [f for f in os.listdir(clips_dir) if f.endswith(".mp4")],
            key=lambda x: int(os.path.splitext(x)[0])
        )
        if not clip_files:
            return "No highlight clips found."

        highlight_clips = [VideoFileClip(os.path.join(clips_dir, f)) for f in clip_files]
        all_clips = [intro_clip] + highlight_clips + [outro_clip]
        min_width = min(clip.w for clip in all_clips)
        min_height = min(clip.h for clip in all_clips)
        resized_clips = [clip.resize(newsize=(min_width, min_height)) for clip in all_clips]
        final_video = concatenate_videoclips(resized_clips)
        final_video.write_videofile(output_path, codec="libx264", audio_codec="aac", verbose=False, logger=None)
        return None
    except Exception as e:
        return str(e)

# Routes

@app.route("/process-video", methods=["POST"])
def process_video():
    """
    Expected form-data:
    - video_id (string): ID for TwelveLabs API
    - video_file (file): Input video file (match video)
    - intro_file (file): Intro video file
    - outro_file (file): Outro video file
    """
    video_id = request.form.get("video_id")
    if not video_id:
        return jsonify({"error": "Missing video_id"}), 400

    # Save uploaded files
    video_file = request.files.get("video_file")
    intro_file = request.files.get("intro_file")
    outro_file = request.files.get("outro_file")

    if not video_file or not intro_file or not outro_file:
        return jsonify({"error": "Missing video_file, intro_file or outro_file"}), 400

    video_filename = secure_filename(video_file.filename)
    video_path = os.path.join(UPLOAD_FOLDER, video_filename)
    video_file.save(video_path)

    intro_filename = secure_filename(intro_file.filename)
    intro_path = os.path.join(UPLOAD_FOLDER, intro_filename)
    intro_file.save(intro_path)

    outro_filename = secure_filename(outro_file.filename)
    outro_path = os.path.join(UPLOAD_FOLDER, outro_filename)
    outro_file.save(outro_path)

    # Call TwelveLabs API to get timestamps and titles
    full_text = call_twelvelabs_api(video_id)
    if not full_text:
        return jsonify({"error": "Failed to get data from TwelveLabs API"}), 500

    # Parse goal ranges and titles
    ranges = parse_and_adjust_goal_ranges(full_text)
    titles = extract_catch_titles(full_text)

    # Create clips with overlays
    clip_paths = trim_video_from_ranges(ranges, video_path, titles)
    if isinstance(clip_paths, str):  # error string returned
        return jsonify({"error": clip_paths}), 500

    # Create final highlight video
    output_highlight_path = os.path.join(UPLOAD_FOLDER, "highlight.mp4")
    err = create_highlight_video(CLIPS_FOLDER, intro_path, outro_path, output_highlight_path)
    if err:
        return jsonify({"error": err}), 500

    # Return path or send file
    return send_file(output_highlight_path, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
