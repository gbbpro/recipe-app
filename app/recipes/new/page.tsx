"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type IngredientSection = {
  label: string;
  items: string[];
};

// ─── Text parser (for .txt files) ────────────────────────────────────────────

const INGREDIENT_SUBSECTION_RE =
  /^(For the |For |To |You will|You'll|You need).+:$/i;

function isSubsectionHeader(line: string): boolean {
  if (line === "Ingredients:" || line === "Instructions:") return false;
  return INGREDIENT_SUBSECTION_RE.test(line);
}

function detectFormat(lines: string[]): "A" | "B" | "C" {
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.trim().startsWith("Recipe Name:")) return "A";
    break;
  }
  if (lines.some((l) => /^Step\s+\d+$/i.test(l.trim()))) return "B";
  return "C";
}

function parseFormatA(lines: string[]) {
  const result = {
    name: "",
    ingredientSections: [] as IngredientSection[],
    instructions: [] as string[],
  };
  let mode = "header";
  let currentSection: IngredientSection | null = null;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("Recipe Name:")) {
      result.name = trimmed.replace("Recipe Name:", "").trim();
      continue;
    }
    if (trimmed === "Ingredients:") {
      mode = "ingredients";
      currentSection = { label: "", items: [] };
      result.ingredientSections.push(currentSection);
      continue;
    }
    if (trimmed === "Instructions:") {
      mode = "instructions";
      continue;
    }
    if (mode === "ingredients" && isSubsectionHeader(trimmed)) {
      currentSection = { label: trimmed.replace(/:$/, ""), items: [] };
      result.ingredientSections.push(currentSection);
      continue;
    }
    if (mode === "ingredients") {
      const item = trimmed.replace(/^[-•]\s*/, "").trim();
      if (item && currentSection) currentSection.items.push(item);
      continue;
    }
    if (mode === "instructions") {
      const step = trimmed.replace(/^\d+\.\s*/, "").trim();
      if (step) result.instructions.push(step);
    }
  }
  return result;
}

function parseFormatB(lines: string[]) {
  const result = {
    name: "",
    ingredientSections: [] as IngredientSection[],
    instructions: [] as string[],
  };
  let nameParsed = false;
  let mode = "ingredients";
  let currentSection: IngredientSection | null = null;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (!nameParsed) {
      result.name = trimmed;
      nameParsed = true;
      currentSection = { label: "", items: [] };
      result.ingredientSections.push(currentSection);
      continue;
    }
    if (/^Step\s+\d+$/i.test(trimmed)) {
      mode = "instructions";
      continue;
    }
    if (mode === "ingredients") {
      if (isSubsectionHeader(trimmed)) {
        currentSection = { label: trimmed.replace(/:$/, ""), items: [] };
        result.ingredientSections.push(currentSection);
      } else if (currentSection)
        currentSection.items.push(trimmed.replace(/^[-•]\s*/, ""));
    } else {
      result.instructions.push(trimmed);
    }
  }
  result.ingredientSections = result.ingredientSections.filter(
    (s) => s.items.length > 0,
  );
  return result;
}

function parseFormatC(lines: string[]) {
  const result = {
    name: "",
    ingredientSections: [] as IngredientSection[],
    instructions: [] as string[],
  };
  let nameParsed = false;
  let mode = "ingredients";
  let currentSection: IngredientSection = { label: "", items: [] };
  result.ingredientSections.push(currentSection);
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (!nameParsed) {
      result.name = trimmed;
      nameParsed = true;
      continue;
    }
    if (/^\d+\.\s*[A-Z]/.test(trimmed) || /^\d+\.\s+\S/.test(trimmed)) {
      mode = "instructions";
      const step = trimmed
        .replace(/^\d+\.\s*(?:[A-Z][A-Z\s]+:\s*)?/, "")
        .trim();
      if (step) result.instructions.push(step);
      continue;
    }
    if (mode === "ingredients") {
      if (isSubsectionHeader(trimmed)) {
        currentSection = { label: trimmed.replace(/:$/, ""), items: [] };
        result.ingredientSections.push(currentSection);
      } else currentSection.items.push(trimmed.replace(/^[-•]\s*/, ""));
    } else {
      result.instructions.push(trimmed);
    }
  }
  result.ingredientSections = result.ingredientSections.filter(
    (s) => s.items.length > 0,
  );
  return result;
}

function parseRecipeText(text: string) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const format = detectFormat(lines);
  if (format === "A") return parseFormatA(lines);
  if (format === "B") return parseFormatB(lines);
  return parseFormatC(lines);
}

// ─── AI parser (for PDFs) ─────────────────────────────────────────────────────

async function parseWithAI(
  file: File,
): Promise<{
  name: string;
  ingredientSections: IngredientSection[];
  instructions: string[];
}> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Extract the recipe from this document and return ONLY a JSON object with this exact structure, no markdown, no explanation:
{
  "name": "Recipe name here",
  "ingredientSections": [
    {
      "label": "Section label or empty string if no label",
      "items": ["ingredient 1", "ingredient 2"]
    }
  ],
  "instructions": ["Step 1 text", "Step 2 text"]
}

Rules:
- If ingredients have sub-sections (e.g. "For the sauce:", "For the dough:"), create separate objects in ingredientSections with that label
- If there are no sub-sections, use a single object with an empty string label
- Strip any leading numbers or bullets from instruction steps
- Keep ingredient quantities exactly as written`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewRecipePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseSuccess, setParseSuccess] = useState("");
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [sections, setSections] = useState<IngredientSection[]>([
    { label: "", items: [""] },
  ]);
  const [notes, setNotes] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setParseError("");
    setParseSuccess("");

    try {
      const text = await file.text();
      const parsed = parseRecipeText(text);
      if (!parsed.name && parsed.ingredientSections.length === 0) {
        setParseError(
          "Couldn't parse this file. Try filling in the form manually.",
        );
      } else {
        if (parsed.name) setName(parsed.name);
        if (parsed.ingredientSections.length > 0) {
          setSections(
            parsed.ingredientSections.map((s) => ({
              label: s.label || "",
              items: s.items.length > 0 ? s.items : [""],
            })),
          );
        }
        if (parsed.instructions.length > 0) {
          setInstructions(parsed.instructions.join("\n"));
        }
        setParseSuccess("✓ Recipe parsed — review and save below");
      }
    } catch (err) {
      setParseError(
        "Failed to read file. Please try again or fill in manually.",
      );
      console.error(err);
    }

    setParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const addSection = () =>
    setSections((s) => [...s, { label: "", items: [""] }]);
  const updateSectionLabel = (i: number, label: string) =>
    setSections((s) =>
      s.map((sec, idx) => (idx === i ? { ...sec, label } : sec)),
    );
  const updateItem = (si: number, ii: number, value: string) =>
    setSections((s) =>
      s.map((sec, idx) =>
        idx === si
          ? {
              ...sec,
              items: sec.items.map((item, jdx) => (jdx === ii ? value : item)),
            }
          : sec,
      ),
    );
  const addItem = (si: number) =>
    setSections((s) =>
      s.map((sec, idx) =>
        idx === si ? { ...sec, items: [...sec.items, ""] } : sec,
      ),
    );
  const removeItem = (si: number, ii: number) =>
    setSections((s) =>
      s.map((sec, idx) =>
        idx === si
          ? { ...sec, items: sec.items.filter((_, jdx) => jdx !== ii) }
          : sec,
      ),
    );
  const removeSection = (i: number) =>
    setSections((s) => s.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ingredientSections = sections
      .map((s) => ({ label: s.label || null, items: s.items.filter(Boolean) }))
      .filter((s) => s.items.length > 0);
    const instructionList = instructions
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".txt";
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        filename,
        ingredientSections,
        instructions: instructionList,
        tags: [],
        isFavorite,
        notes: notes || null,
      }),
    });
    if (res.ok) {
      const recipe = await res.json();
      router.push(`/recipes/${recipe.id}`);
    } else {
      setSaving(false);
      alert("Failed to save recipe");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: "0.9rem",
    background: "var(--bg)",
    outline: "none",
    color: "var(--text)",
  };
  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--text-muted)",
    marginBottom: "6px",
  };

  return (
    <main style={{ padding: "48px 0 80px" }}>
      <div className="container" style={{ maxWidth: "680px" }}>
        <a
          href="/recipes"
          style={{
            display: "inline-block",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginBottom: "32px",
          }}
        >
          ← Back to recipes
        </a>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 600,
            marginBottom: "32px",
            letterSpacing: "-0.02em",
          }}
        >
          Add New Recipe
        </h1>

        {/* File upload zone */}
        <div
          style={{
            border: "2px dashed var(--border)",
            borderRadius: "var(--radius)",
            padding: "28px",
            marginBottom: "32px",
            textAlign: "center",
            background: "var(--surface)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📄</div>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text)",
              fontWeight: 500,
              marginBottom: "4px",
            }}
          >
            Upload a recipe file to auto-fill
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "16px",
            }}
          >
            Supports .txt files
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={{
              display: "inline-block",
              padding: "9px 22px",
              background: parsing ? "var(--border)" : "var(--accent)",
              color: "white",
              borderRadius: "var(--radius)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: parsing ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {parsing ? "⏳ Parsing..." : "Choose File"}
          </label>
          {parseError && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#c0392b",
                marginTop: "12px",
              }}
            >
              {parseError}
            </p>
          )}
          {parseSuccess && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--accent)",
                marginTop: "12px",
                fontWeight: 500,
              }}
            >
              {parseSuccess}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Recipe Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Chocolate Lava Cake"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Ingredients */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Ingredients</label>
            {sections.map((section, si) => (
              <div
                key={si}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    value={section.label}
                    onChange={(e) => updateSectionLabel(si, e.target.value)}
                    placeholder="Section label (optional)"
                    style={{ ...inputStyle, flex: 1, fontSize: "0.85rem" }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--accent)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(si)}
                      style={{
                        border: "none",
                        background: "none",
                        color: "var(--text-muted)",
                        fontSize: "1rem",
                        padding: "4px",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                {section.items.map((item, ii) => (
                  <div
                    key={ii}
                    style={{ display: "flex", gap: "8px", marginBottom: "6px" }}
                  >
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(si, ii, e.target.value)}
                      placeholder="e.g. 2 cups flour"
                      style={{ ...inputStyle, flex: 1, fontSize: "0.875rem" }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--accent)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                    {section.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(si, ii)}
                        style={{
                          border: "none",
                          background: "none",
                          color: "var(--text-muted)",
                          fontSize: "1rem",
                          padding: "4px",
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem(si)}
                  style={{
                    marginTop: "4px",
                    border: "none",
                    background: "none",
                    color: "var(--accent)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  + Add ingredient
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSection}
              style={{
                border: "1px dashed var(--border)",
                background: "none",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                fontWeight: 500,
                padding: "8px 14px",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                width: "100%",
              }}
            >
              + Add ingredient section
            </button>
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Instructions</label>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              One step per line
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              rows={10}
              placeholder={`Preheat oven to 350°F.\nMix dry ingredients together.\nAdd wet ingredients and stir until combined.`}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Notes</label>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              Personal tweaks, tips, or reminders
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="e.g. Add extra vanilla, bake 5 min less in my oven..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Favorite */}
          <div
            style={{
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              type="checkbox"
              id="favorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "var(--accent)",
              }}
            />
            <label
              htmlFor="favorite"
              style={{
                fontSize: "0.9rem",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Mark as favorite
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? "var(--text-muted)" : "var(--accent)",
              color: "white",
              border: "none",
              padding: "12px 28px",
              borderRadius: "var(--radius)",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Recipe"}
          </button>
        </form>
      </div>
    </main>
  );
}
