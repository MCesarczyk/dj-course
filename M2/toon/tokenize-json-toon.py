from tokenizers import Tokenizer
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKENIZER_DIR = os.path.join(SCRIPT_DIR, "tokenizers")
SAMPLES_DIR = os.path.join(SCRIPT_DIR, "samples")

# Load all tokenizers
ALL_TOKENIZERS = {}

if not os.path.isdir(TOKENIZER_DIR):
    print(f"❌ Error: Tokenizer directory not found at {TOKENIZER_DIR}")
    exit(1)

for filename in os.listdir(TOKENIZER_DIR):
    if filename.endswith(".json"):
        key = filename[:-5]  # remove .json
        full_path = os.path.join(TOKENIZER_DIR, filename)
        try:
            ALL_TOKENIZERS[key] = Tokenizer.from_file(full_path)
        except Exception as e:
            print(f"❌ Error loading tokenizer '{key}' from '{full_path}': {e}")

if not ALL_TOKENIZERS:
    print(f"❌ Error: No tokenizers found in {TOKENIZER_DIR}")
    exit(1)

print(
    f"✅ Loaded {len(ALL_TOKENIZERS)} tokenizer(s): {', '.join(ALL_TOKENIZERS.keys())}\n"
)


# Discover all samples
def get_samples():
    """Extract unique sample names from available files."""
    samples = set()
    if not os.path.isdir(SAMPLES_DIR):
        print(f"❌ Error: Samples directory not found at {SAMPLES_DIR}")
        return []

    for filename in os.listdir(SAMPLES_DIR):
        # Match any of: .json, -nows.json, .toon, .yaml
        if filename.endswith((".json", ".toon", ".yaml")):
            if filename.endswith("-nows.json"):
                samples.add(filename[:-10])  # remove -nows.json
            elif filename.endswith(".json"):
                samples.add(filename[:-5])  # remove .json
            elif filename.endswith(".toon"):
                samples.add(filename[:-5])  # remove .toon
            elif filename.endswith(".yaml"):
                samples.add(filename[:-5])  # remove .yaml
    return sorted(samples)


SAMPLES = get_samples()

if not SAMPLES:
    print(f"❌ Error: No samples found in {SAMPLES_DIR}")
    exit(1)

print(f"✅ Found {len(SAMPLES)} sample(s): {', '.join(SAMPLES)}\n")


# Load sample data
def load_sample_data(sample_name):
    """Load all four format variants of a sample."""
    data = {}

    formats = [
        ("json", f"{sample_name}.json"),
        ("nows-json", f"{sample_name}-nows.json"),
        ("toon", f"{sample_name}.toon"),
        ("yaml", f"{sample_name}.yaml"),
    ]

    for format_key, filename in formats:
        file_path = os.path.join(SAMPLES_DIR, filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data[format_key] = f.read()
        except FileNotFoundError:
            data[format_key] = ""

    return data


# Tokenize all combinations
results = {}

for sample_name in SAMPLES:
    sample_data = load_sample_data(sample_name)

    # Skip if all formats are missing
    if all(value == "" for value in sample_data.values()):
        print(f"⚠️ Skipping sample '{sample_name}': All required files are missing.")
        continue

    results[sample_name] = {}

    for tokenizer_name, tokenizer in ALL_TOKENIZERS.items():
        try:
            format_counts = {}
            for format_key, content in sample_data.items():
                if content:
                    encoded = tokenizer.encode(content)
                    format_counts[format_key] = len(encoded.ids)
                else:
                    format_counts[format_key] = None

            results[sample_name][tokenizer_name] = format_counts
        except Exception as e:
            print(
                f"❌ Error processing sample '{sample_name}' with tokenizer '{tokenizer_name}': {e}"
            )

# Display results
print("\n" + "=" * 100)
print("TOKENIZATION EFFECTIVENESS COMPARISON")
print("=" * 100)

formats = ["json", "nows-json", "yaml", "toon"]
format_colors = {"json": "🟦", "nows-json": "🟩", "yaml": "🟨", "toon": "🟧"}

for sample_name in SAMPLES:
    if sample_name not in results:
        continue

    print(f"\n📊 Sample: {sample_name}")
    print("-" * 100)

    tokenizer_results = results[sample_name]

    # Find max width for alignment
    max_tokenizer_width = max(len(name) for name in tokenizer_results.keys())

    # Find global max count for scaling
    max_count = 0
    for tokenizer_name in tokenizer_results:
        for fmt in formats:
            count = tokenizer_results[tokenizer_name].get(fmt)
            if count:
                max_count = max(max_count, count)

    # Header
    header = f"{'Tokenizer':<{max_tokenizer_width}}  {'Format':<12}  {'Tokens':>10}  │ Visual"
    print(header)
    print("-" * 100)

    # Rows with visual bars - one row per format
    for tokenizer_name in sorted(tokenizer_results.keys()):
        counts = tokenizer_results[tokenizer_name]

        for fmt_idx, fmt in enumerate(formats):
            count = counts.get(fmt)

            if fmt_idx == 0:
                # Show tokenizer name only on first row
                row = f"{tokenizer_name:<{max_tokenizer_width}}"
            else:
                # Empty space for other rows
                row = f"{' ' * max_tokenizer_width}"

            if count is not None:
                row += f"  {fmt:<12}  {count:>10}  │ "

                # Visual bar representation
                if max_count > 0:
                    bar_width = 30
                    bar_length = int((count / max_count) * bar_width)
                    color = format_colors[fmt]
                    row += color * bar_length
            else:
                row += f"  {fmt:<12}  {'N/A':>10}  │ "

            print(row)

        print()  # Empty line between tokenizers

    # Legend
    print("  Legend:")
    print("  🟦 json  🟩 nows-json  🟨 yaml  🟧 toon")

print("\n" + "=" * 100)
