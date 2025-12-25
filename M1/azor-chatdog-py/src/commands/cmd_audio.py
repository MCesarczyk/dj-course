import os
import subprocess
from datetime import datetime

from ..session import SessionManager
from ..cli.console import print_info, print_error
from ..xtts import run_tts

INPUT_FILE_PATH = "./src/files/sounds/sample-agent.wav"
# INPUT_FILE_PATH = "./src/files/sounds/dzien swira-czy panowie.mp3"
# INPUT_FILE_PATH = "./src/files/sounds/Oczom ich ukazał się las... krzyży.mp3"
OUTPUT_WAV_PATH = "./src/files/sounds/"
FILENAME = "output.wav"

def cmd_audio(session_manager: SessionManager, *args):
    """
    Generates an audio file from the last chat response or provided text.
    Saves the audio file in the 'audio_output' directory.
    Usage:
        /audio - generates audio from the last model response
        /audio <text to generate> - generates audio from the provided text
    """
    text_to_generate = ""
    if args:
        text_to_generate = " ".join(args)

    if not text_to_generate:
        if not session_manager.has_active_session():
            print_error(
                "No active session. Start a conversation or provide text to generate."
            )
            return

        current_session = session_manager.get_current_session()
        last_response = current_session.get_last_model_response()

        if not last_response:
            print_error(
                "No model response found. Provide text to generate: /audio <text>"
            )
            return

        text_to_generate = last_response

    output_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "audio_output")
    )
    os.makedirs(output_dir, exist_ok=True)

    session_id = "custom"
    if session_manager.has_active_session():
        session_id = session_manager.get_current_session().session_id

    output_filename = f"{session_id}_{datetime.now().isoformat()}.wav"
    output_path = os.path.join(output_dir, output_filename)

    print_info(f"Generating audio... (this may take a moment)")

    try:
        run_tts([text_to_generate], INPUT_FILE_PATH, output_path)
        print_info(f"Audio saved to: {os.path.relpath(output_path)}")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to generate audio.")
        print_error(f"Stderr: {e.stderr}")
    except Exception as e:
        print_error(f"An unexpected error occurred: {e}")
