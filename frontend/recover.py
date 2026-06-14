import json
import os

transcript_path = r"C:\Users\HP\.gemini\antigravity-ide\brain\1df3913a-70f7-42ba-a8de-4f82b230ec13\.system_generated\logs\transcript.jsonl"
output_path = r"C:\Users\HP\Desktop\mini crm\frontend\recovered_page.tsx"

recovered_content = ""

try:
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line)
            # Look for VIEW_FILE output or replace_file_content output
            # Actually, I need to see if the file was ever read!
            # The prompt says: "The Journey Builder UI already exists but is currently only a static screen... DO NOT redesign... KEEP existing layout"
            # It's possible the user provided the code, or I read it earlier in the conversation.
            
            # Let's search for "function JourneyBuilder" in the transcript
            if 'content' in data and data['content'] and 'function JourneyBuilder' in data['content']:
                print(f"Found in content of step {data.get('step_index')}")
                
            if 'output' in data and data['output'] and 'function JourneyBuilder' in data['output']:
                print(f"Found in output of step {data.get('step_index')}")
                # We want the most recent read before step 249
                if int(data.get('step_index', 0)) < 249:
                    recovered_content = data['output']

    if recovered_content:
        with open("raw_output.txt", "w", encoding="utf-8") as out:
            out.write(recovered_content)
        print("Successfully wrote recovered content to raw_output.txt")
    else:
        print("Could not find the original file content in the transcript.")
except Exception as e:
    print(f"Error: {e}")
