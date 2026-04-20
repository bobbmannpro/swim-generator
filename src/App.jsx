import { useState, useEffect } from "react";

const MICHAEL_DEFAULT_PROFILE = `You are a swim coach assistant building workouts specifically for Michael Anton, a 55-year-old male swimmer with the following profile:

PERFORMANCE DATA (actual times):
- 100 freestyle strong effort: 1:29-1:32
- 100 freestyle moderate: 1:38-1:43
- 100 freestyle pull small paddles: high 1:30s
- 100 freestyle pull large paddles: 1:40-1:42
- 100 freestyle pull buoy only: 1:43-1:46
- 100 freestyle with fins: 1:17-1:20
- 100 freestyle hard kick no fins: 1:33-1:35
- 100 kickboard kicks: 1:52-1:57
- 50 freestyle sprint: 0:36-0:37
- 50 freestyle moderate: 0:41-0:43
- 200 freestyle moderate: 3:11-3:36
- 300 freestyle moderate/easy: 5:06
- 500 freestyle moderate: 8:22-8:55
- 750 freestyle easy: 14:08
- 25 butterfly: 0:19-0:20
- 50 backstroke: mid 20s

SEND-OFF GUIDELINES based on his times:
- 100 strong effort: 1:50
- 100 moderate: 2:00
- 100 pull: 2:00
- 100 fins: 1:40
- 100 kickboard: 2:20
- 50 sprint: 1:00
- 50 moderate: 1:10
- 50 kick: 1:05
- 25 dolphin kicks: 0:45
- 25 butterfly: 0:45
- 200 pull: 3:45
- 300: 5:30
- 500: 9:30

MICHAEL'S PROFILE:
- Goal: 1:30/100y consistent pace
- Strong kick — unleash it, do not suppress
- Butterfly OK in short distances only (25s max)
- Backstroke decent
- Breaststroke poor — avoid or minimal only
- Pull buoy trouble on flip turns — never go over 200y with buoy
- Large paddles feel awkward — use sparingly
- Wrist/hand position issue being corrected — include catch drills
- Tends to spiral mentally after bad workouts
- Needs confidence building sets
- Responds well to fins sets
- No snorkel in warm-up — working on stroke cadence

TOOLS AVAILABLE:
- Pull buoy (low position = ankles, high position = knees)
- Small paddles
- Large paddles
- Fins
- Kickboard
- Snorkel (main set only)

WORKOUT FORMAT RULES — CRITICAL:
- Use exactly this format with each item on its own line
- No markdown, no bullet points, no bold, no headers with ##
- Tool changes go on their own line (e.g. "Fins on" / "Fins off")
- Intervals in parentheses e.g. (30) mean rest in seconds
- Send-offs written as "on 1:50"
- Always include total yardage at the end
- Never exceed 200y with pull buoy due to flip turn issues
- No breaststroke unless specifically requested
- No snorkel in warm-up

EXAMPLE FORMAT:
Warm-Up
100 streamline back kicks
100 single arm catch R,L,R,L
100 catch-up
100 freestyle easy

Main Set
Buoy on / small paddles on
4x100 on 2:00 freestyle pull moderate
Small paddles off
6x50 on 1:05 freestyle HARD odds / easy evens
Buoy off
Fins on
4x25 on :45 underwater dolphin kicks ALL OUT
Fins off

Cool-Down
100 easy freestyle
100 backstroke easy

Total: 2500y`;

const PROFILE_TEMPLATE = `You are a swim coach assistant building workouts specifically for [SWIMMER NAME], a [AGE]-year-old [male/female] swimmer with the following profile:

PERFORMANCE DATA (actual times):
- 100 freestyle strong effort: [time]
- 100 freestyle moderate: [time]
- 100 freestyle with fins: [time]
- 50 freestyle sprint: [time]
- 500 freestyle moderate: [time]
[add more distances/strokes as needed]

SEND-OFF GUIDELINES based on their times:
- 100 strong effort: [send-off]
- 100 moderate: [send-off]
- 50 sprint: [send-off]
[add more as needed]

SWIMMER PROFILE:
- Goal: [main goal]
- Strengths: [strengths]
- Weaknesses: [weaknesses/limitations]
- Tools available: Pull buoy, Small paddles, Large paddles, Fins, Kickboard, Snorkel

WORKOUT FORMAT RULES — CRITICAL:
- Use exactly this format with each item on its own line
- No markdown, no bullet points, no bold, no headers with ##
- Tool changes go on their own line (e.g. "Fins on" / "Fins off")
- Intervals in parentheses e.g. (30) mean rest in seconds
- Send-offs written as "on 1:50"
- Always include total yardage at the end`;

const DEFAULT_SWIMMERS = [
  { id: "michael-anton", name: "Michael Anton", systemPrompt: MICHAEL_DEFAULT_PROFILE },
];

const WORKOUT_TYPES = [
  "Sprints", "Send-offs", "Endurance / Long Sets", "Heavy Pull",
  "Heavy Kick", "Drill Focused", "Pyramid", "Confidence Builder", "Mixed / Everything",
];

const YARDAGE_OPTIONS = [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

const TOOL_OPTIONS = [
  "Pull buoy", "Small paddles", "Large paddles", "Fins", "Kickboard",
  "Snorkel (main set only)", "No tools",
];

const ALL_STROKES = ["Freestyle", "Backstroke", "Butterfly", "Breaststroke", "IM"];

const DRILLS_BY_STROKE = {
  Freestyle: [
    "Catch-up",
    "Single arm (R, L, R, L)",
    "Fingertip drag",
    "High elbow catch",
    "Fist drill",
    "Sculling",
    "3-stroke rotate",
    "Tarzan drill",
    "Side kick balance",
    "Streamline kicks",
  ],
  Backstroke: [
    "Single arm backstroke",
    "Fingertip drag backstroke",
    "Catch-up backstroke",
    "Side rotation",
    "Streamline back kicks",
    "Double arm backstroke",
  ],
  Butterfly: [
    "Single arm butterfly",
    "2-kick butterfly",
    "Butterfly arms / freestyle kick",
    "Underwater dolphin kicks",
    "Body wave",
    "3-right 3-left butterfly",
  ],
  Breaststroke: [
    "Pull-out drill",
    "2-kick 1-pull",
    "Glide drill",
    "Kick-only with board",
    "Breaststroke arms / flutter kick",
    "Heads-up breaststroke",
  ],
  IM: [
    "IM order drill",
    "Stroke transition focus",
    "One-length-each stroke",
    "Reverse IM",
  ],
};

function loadSwimmers() {
  try {
    const saved = localStorage.getItem("swim-generator-swimmers");
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return DEFAULT_SWIMMERS;
}

export default function App() {
  const [swimmers, setSwimmers] = useState(loadSwimmers);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState(() => loadSwimmers()[0]?.id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProfile, setNewProfile] = useState(PROFILE_TEMPLATE);

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [yardage, setYardage] = useState(3000);
  const [tools, setTools] = useState([]);
  const [selectedStrokes, setSelectedStrokes] = useState(["Freestyle"]);
  const [drillsByStroke, setDrillsByStroke] = useState({});
  const [customSets, setCustomSets] = useState([]);
  const [newSetInput, setNewSetInput] = useState("");
  const [notes, setNotes] = useState("");
  const [workout, setWorkout] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("swim-generator-swimmers", JSON.stringify(swimmers));
  }, [swimmers]);

  const selectedSwimmer = swimmers.find((s) => s.id === selectedSwimmerId) || swimmers[0];

  const addSwimmer = () => {
    if (!newName.trim() || !newProfile.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setSwimmers((prev) => [...prev, { id, name: newName.trim(), systemPrompt: newProfile.trim() }]);
    setSelectedSwimmerId(id);
    setNewName("");
    setNewProfile(PROFILE_TEMPLATE);
    setShowAddForm(false);
    setWorkout("");
  };

  const deleteSwimmer = (id) => {
    if (swimmers.length <= 1) return;
    const remaining = swimmers.filter((s) => s.id !== id);
    setSwimmers(remaining);
    if (selectedSwimmerId === id) { setSelectedSwimmerId(remaining[0].id); setWorkout(""); }
  };

  const toggleType = (type) =>
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);

  const toggleTool = (tool) => {
    if (tool === "No tools") { setTools(["No tools"]); return; }
    setTools((prev) => {
      const f = prev.filter((t) => t !== "No tools");
      return f.includes(tool) ? f.filter((t) => t !== tool) : [...f, tool];
    });
  };

  const toggleStroke = (stroke) => {
    setSelectedStrokes((prev) => {
      if (prev.includes(stroke)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((s) => s !== stroke);
        setDrillsByStroke((d) => { const copy = { ...d }; delete copy[stroke]; return copy; });
        return next;
      }
      return [...prev, stroke];
    });
  };

  const toggleDrillForStroke = (stroke, drill) => {
    setDrillsByStroke((prev) => {
      const current = prev[stroke] || [];
      const next = current.includes(drill) ? current.filter((d) => d !== drill) : [...current, drill];
      return { ...prev, [stroke]: next };
    });
  };

  const addCustomSet = () => {
    if (!newSetInput.trim()) return;
    setCustomSets((prev) => [...prev, { id: Date.now(), text: newSetInput.trim() }]);
    setNewSetInput("");
  };

  const removeCustomSet = (id) => setCustomSets((prev) => prev.filter((s) => s.id !== id));

  const generateWorkout = async () => {
    if (selectedTypes.length === 0) { setError("Please select at least one workout type."); return; }
    setError("");
    setLoading(true);
    setWorkout("");

    const toolsList = tools.length > 0 ? tools.join(", ") : "Coach's choice";
    const typesList = selectedTypes.join(" + ");

    const drillLines = selectedStrokes
      .map((stroke) => {
        const selected = drillsByStroke[stroke];
        if (!selected || selected.length === 0) return `${stroke}: coach's choice`;
        return `${stroke}: ${selected.join(", ")}`;
      })
      .join("\n");

    const customSetLines = customSets.length > 0
      ? `\nREQUIRED SETS — include these exactly in the main set:\n${customSets.map((s) => `- ${s.text}`).join("\n")}`
      : "";

    const prompt = `Generate a ${yardage}-yard swim workout for ${selectedSwimmer.name} with the following parameters:

Workout Type: ${typesList}
Yardage: ${yardage}y
Tools to use: ${toolsList}
Strokes to include: ${selectedStrokes.join(", ")}
Drills per stroke:
${drillLines}
${customSetLines}
Additional notes: ${notes || "None"}

Return ONLY the workout in the exact format specified. No preamble, no explanation, no coaching notes after. Just the workout itself starting with Warm-Up and ending with Total: ${yardage}y.

Make sure send-offs are based on the swimmer's actual performance data. Make sure the yardage adds up exactly to ${yardage}.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: selectedSwimmer.systemPrompt,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      setWorkout(data.content?.map((c) => c.text || "").join("") || "");
    } catch (_) {
      setError("Something went wrong generating the workout. Please try again.");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(workout).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(fallbackCopy);
    } else { fallbackCopy(); }
  };

  const fallbackCopy = () => {
    const el = document.createElement("textarea");
    el.value = workout;
    el.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(el);
    el.focus(); el.select();
    try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { alert("Copy failed. Please select the text manually."); }
    document.body.removeChild(el);
  };

  const chip = (active) => ({
    padding: "8px 14px", borderRadius: 20, border: "2px solid",
    borderColor: active ? "#1a3a5c" : "#ddd",
    backgroundColor: active ? "#1a3a5c" : "white",
    color: active ? "white" : "#333",
    cursor: "pointer", fontSize: 13, fontWeight: active ? "bold" : "normal",
  });

  const smallChip = (active) => ({
    padding: "5px 11px", borderRadius: 16, border: "1px solid",
    borderColor: active ? "#1a3a5c" : "#ccc",
    backgroundColor: active ? "#e8f0f8" : "white",
    color: active ? "#1a3a5c" : "#555",
    cursor: "pointer", fontSize: 12, fontWeight: active ? "bold" : "normal",
  });

  const card = { backgroundColor: "white", borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "0 auto", padding: 20, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#1a3a5c", color: "white", padding: "20px", borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 28 }}>🏊</div>
        <div style={{ fontSize: 22, fontWeight: "bold" }}>Swim Generator</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>AI-powered workouts built around each swimmer</div>
      </div>

      {/* Swimmer Selector */}
      <div style={card}>
        <div style={{ fontWeight: "bold", color: "#1a3a5c", marginBottom: 10 }}>Swimmer</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {swimmers.map((s) => (
            <button key={s.id} onClick={() => { setSelectedSwimmerId(s.id); setWorkout(""); }} style={chip(selectedSwimmerId === s.id)}>
              {selectedSwimmerId === s.id ? "✓ " : ""}{s.name}
            </button>
          ))}
          <button onClick={() => setShowAddForm(true)} style={{ padding: "8px 14px", borderRadius: 20, border: "2px dashed #1a3a5c", backgroundColor: "white", color: "#1a3a5c", cursor: "pointer", fontSize: 13 }}>
            + Add Swimmer
          </button>
        </div>
        {selectedSwimmer?.id !== "michael-anton" && (
          <button onClick={() => deleteSwimmer(selectedSwimmer.id)} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Remove {selectedSwimmer?.name}
          </button>
        )}
      </div>

      {/* Add Swimmer Form */}
      {showAddForm && (
        <div style={{ ...card, border: "2px solid #1a3a5c" }}>
          <div style={{ fontWeight: "bold", color: "#1a3a5c", marginBottom: 12, fontSize: 15 }}>New Swimmer Profile</div>
          <input
            value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Swimmer name (e.g. Jane Smith)"
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 13, marginBottom: 10, boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>Fill in the profile below — replace all [bracketed] fields with real data.</div>
          <textarea
            value={newProfile} onChange={(e) => setNewProfile(e.target.value)} rows={18}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button onClick={addSwimmer} disabled={!newName.trim() || !newProfile.trim()}
              style={{ flex: 1, padding: 10, backgroundColor: "#1a3a5c", color: "white", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>
              Save Swimmer
            </button>
            <button onClick={() => { setShowAddForm(false); setNewName(""); setNewProfile(PROFILE_TEMPLATE); }}
              style={{ padding: "10px 16px", backgroundColor: "#eee", color: "#333", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workout Type */}
      <div style={card}>
        <div style={{ fontWeight: "bold", color: "#1a3a5c", marginBottom: 2 }}>Workout Type</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Select one or more focuses</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {WORKOUT_TYPES.map((type) => (
            <button key={type} onClick={() => toggleType(type)} style={chip(selectedTypes.includes(type))}>
              {selectedTypes.includes(type) ? "✓ " : ""}{type}
            </button>
          ))}
        </div>
        {selectedTypes.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#1a3a5c", fontStyle: "italic" }}>Selected: {selectedTypes.join(" + ")}</div>
        )}
      </div>

      {/* Yardage */}
      <div style={card}>
        <div style={{ fontWeight: "bold", marginBottom: 10, color: "#1a3a5c" }}>Yardage: {yardage}y</div>
        <input type="range" min={1500} max={5000} step={500} value={yardage}
          onChange={(e) => setYardage(Number(e.target.value))} style={{ width: "100%", accentColor: "#1a3a5c" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginTop: 4 }}>
          <span>1500</span><span>5000</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {YARDAGE_OPTIONS.map((y) => (
            <button key={y} onClick={() => setYardage(y)} style={{
              padding: "5px 12px", borderRadius: 15, border: "1px solid",
              borderColor: yardage === y ? "#1a3a5c" : "#ddd",
              backgroundColor: yardage === y ? "#1a3a5c" : "white",
              color: yardage === y ? "white" : "#555", cursor: "pointer", fontSize: 12,
            }}>{y}y</button>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div style={card}>
        <div style={{ fontWeight: "bold", marginBottom: 10, color: "#1a3a5c" }}>Tools</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TOOL_OPTIONS.map((tool) => (
            <button key={tool} onClick={() => toggleTool(tool)} style={chip(tools.includes(tool))}>{tool}</button>
          ))}
        </div>
      </div>

      {/* Strokes + Drills per stroke */}
      <div style={card}>
        <div style={{ fontWeight: "bold", color: "#1a3a5c", marginBottom: 4 }}>Strokes</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Select strokes — then pick drills for each</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {ALL_STROKES.map((stroke) => (
            <button key={stroke} onClick={() => toggleStroke(stroke)} style={chip(selectedStrokes.includes(stroke))}>
              {selectedStrokes.includes(stroke) ? "✓ " : ""}{stroke}
            </button>
          ))}
        </div>

        {selectedStrokes.map((stroke) => (
          <div key={stroke} style={{ marginBottom: 16, paddingTop: 14, borderTop: "1px solid #eee" }}>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#1a3a5c", marginBottom: 8 }}>
              {stroke} Drills
              <span style={{ fontSize: 11, fontWeight: "normal", color: "#888", marginLeft: 8 }}>
                {(drillsByStroke[stroke]?.length || 0) === 0 ? "coach's choice" : drillsByStroke[stroke].join(", ")}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DRILLS_BY_STROKE[stroke].map((drill) => (
                <button key={drill} onClick={() => toggleDrillForStroke(stroke, drill)}
                  style={smallChip((drillsByStroke[stroke] || []).includes(drill))}>
                  {(drillsByStroke[stroke] || []).includes(drill) ? "✓ " : ""}{drill}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Sets */}
      <div style={card}>
        <div style={{ fontWeight: "bold", color: "#1a3a5c", marginBottom: 4 }}>Custom Sets</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Add specific sets you want included in the workout</div>

        {customSets.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {customSets.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, backgroundColor: "#f0f4f8", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ flex: 1, fontSize: 13, color: "#222", fontFamily: "monospace" }}>{s.text}</div>
                <button onClick={() => removeCustomSet(s.id)} style={{ background: "none", border: "none", color: "#cc0000", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newSetInput}
            onChange={(e) => setNewSetInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomSet()}
            placeholder='e.g. "8x50 on 1:00 all out" or "1x500 negative split"'
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box" }}
          />
          <button onClick={addCustomSet} disabled={!newSetInput.trim()}
            style={{ padding: "9px 16px", backgroundColor: newSetInput.trim() ? "#1a3a5c" : "#ccc", color: "white", border: "none", borderRadius: 8, cursor: newSetInput.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: "bold", whiteSpace: "nowrap" }}>
            + Add
          </button>
        </div>
      </div>

      {/* Notes */}
      <div style={card}>
        <div style={{ fontWeight: "bold", marginBottom: 8, color: "#1a3a5c" }}>Additional Notes (optional)</div>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. taper day, confidence focus, time trial prep, no large paddles..."
          style={{ width: "100%", minHeight: 70, padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
        />
      </div>

      {error && (
        <div style={{ backgroundColor: "#fff3f3", border: "1px solid #ffcccc", borderRadius: 8, padding: 12, marginBottom: 12, color: "#cc0000", fontSize: 13 }}>{error}</div>
      )}

      <button onClick={generateWorkout} disabled={loading} style={{
        width: "100%", padding: 14, backgroundColor: loading ? "#aaa" : "#1a3a5c",
        color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer", marginBottom: 20,
      }}>
        {loading ? `Generating ${selectedSwimmer?.name}'s Workout...` : `Generate ${selectedSwimmer?.name}'s Workout`}
      </button>

      {workout && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: "bold", color: "#1a3a5c", fontSize: 15 }}>{selectedSwimmer?.name}'s Workout</div>
            <button onClick={copyToClipboard} style={{
              padding: "7px 14px", backgroundColor: copied ? "#2e7d32" : "#1a3a5c",
              color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13,
            }}>
              {copied ? "Copied!" : "Copy for TrainingPeaks"}
            </button>
          </div>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "sans-serif", fontSize: 14, lineHeight: 1.8, color: "#222", margin: 0 }}>
            {workout}
          </pre>
        </div>
      )}
    </div>
  );
}
