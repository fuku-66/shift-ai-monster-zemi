# ドット絵 生成プロンプト集

**使用ツール**: GPT Image 2（ChatGPT image generation）
**既存素材**: `assets/sprites-original/` を参照
**カラーパレット**: 紫×ゴールド

---

## スタイルガイド（既存2枚から抽出）

以下は Image 1.png（ベビー）・Image 2.png（タマゴ）から抽出した共通スタイル：

| 要素 | 仕様 |
|------|------|
| カラー | 主色 = 紫（#7D3C98系）／差し色 = ゴールド（#F1C40F系） |
| 輪郭 | 黒い1〜2pxの輪郭線あり |
| 解像度感 | 中程度のドット粒度（極小ドットではなく見やすい大きめピクセル） |
| 背景 | 完全透明（RGBA、四隅 alpha=0） |
| ハイライト | 白〜淡い色のハイライト点でツヤ感を演出 |
| 影 | 色違いで陰影をつけてる（単色ベタではない） |
| 全体の雰囲気 | ポケモン・ドラゴンクエスト風の親しみやすさ |

---

## 共通プロンプトテンプレ

```
Pixel art sprite, retro RPG style,
[キャラクター説明],
purple and gold color palette (#7D3C98 purple body, #F1C40F gold accents),
black outline (1-2px),
visible pixel structure (mid-resolution dot art),
transparent background,
clean highlights and shadows,
inspired by Pokémon / Dragon Quest sprite art,
cute but cool, slight retro game feel,
full body visible, facing slightly to the right,
no text, no signature
```

---

## 各Lv別プロンプト

### Lv.1 タマゴ ✅（生成済み）

```
Pixel art sprite, retro RPG style,
a mystical dragon egg about to hatch,
purple shell with gold spots and small cracks running down the side,
black outline, mid-resolution pixel art,
subtle highlight on top-left for shiny effect,
small shadow at the base,
transparent background,
cute and mysterious vibe,
inspired by Pokémon / Dragon Quest egg sprites
```

**ファイル**: `assets/sprites/lv1-egg.png`（512×512）
**原本**: `assets/sprites-original/lv1-egg-1024.png`

---

### Lv.2 ベビードラゴン ✅（生成済み）

```
Pixel art sprite, retro RPG style,
a cute baby dragon standing on two legs,
purple body with gold belly scales,
small gold horns on head, small gold wings on back,
big round purple eyes with white highlights,
happy open mouth showing tiny fangs,
black outline, mid-resolution pixel art,
transparent background,
chibi proportions (big head, small body),
cute and friendly vibe,
inspired by Pokémon starter sprite art
```

**ファイル**: `assets/sprites/lv2-baby.png`（512×512）
**原本**: `assets/sprites-original/lv2-baby-2048.png`

---

### Lv.3 若竜（未生成）

**推奨プロンプト案**:
```
Pixel art sprite, retro RPG style,
a young dragon in its juvenile stage,
grown from baby dragon form (same color palette: purple body + gold accents),
more defined wings (larger than baby), sharper horns (2-3 horns),
standing tall and confident, slight smirk showing teen-dragon personality,
longer body, tail starting to get muscular,
purple body (#7D3C98), gold belly and gold wing membrane (#F1C40F),
black outline, mid-resolution pixel art,
transparent background,
inspired by Pokémon mid-evolution sprites,
full body, facing slightly to the right
```

**予定ファイル**: `assets/sprites/lv3-young.png`

---

### Lv.4 成竜（未生成）

**推奨プロンプト案**:
```
Pixel art sprite, retro RPG style,
an adult dragon in its mature form,
purple body with gold armor-like chest plate,
large wings spread slightly, multiple horns and spikes along back,
powerful stance, fierce but wise expression,
long tail with gold tip, sharp claws,
purple body (#7D3C98) with deeper purple shadows,
gold highlights on wings, belly, and horns (#F1C40F),
black outline, mid-resolution pixel art,
transparent background,
inspired by Pokémon final-evolution sprites,
full body, slightly imposing but not scary,
cute-cool balance
```

**予定ファイル**: `assets/sprites/lv4-adult.png`

---

### Lv.5 神竜（未生成）

**推奨プロンプト案**:
```
Pixel art sprite, retro RPG legendary style,
a divine god-tier dragon at maximum evolution,
majestic pose with wings fully spread,
glowing golden aura, radiant light effects around body,
ornate gold crown or horns, gold chest armor,
deep royal purple body (#5B2C6F) with glowing gold accents (#F1C40F),
pixel-art sparkle/glow effects (small cross-shaped sparkles),
black outline, mid-resolution pixel art,
transparent background,
inspired by legendary Pokémon or JRPG final boss sprites,
epic and divine vibe,
full body, facing slightly forward,
cute-cool balance maintained
```

**予定ファイル**: `assets/sprites/lv5-god.png`

---

## Phase 2 以降のプロンプト（参考・未生成）

### フェンリル（レア進化・伝説モフモフ）
```
Pixel art sprite, retro RPG legendary style,
a mystical wolf deity "Fenrir",
fluffy white and silver fur with purple crystal accents,
glowing blue eyes, multiple tails (3-5 tails),
regal posture, facing slightly to the right,
pixel-art sparkle effects,
black outline, mid-resolution pixel art,
transparent background
```

### 九尾の狐（レア進化）
```
Pixel art sprite, retro RPG legendary style,
a nine-tailed fox spirit,
golden/orange fur with red flame accents,
nine flowing tails spreading behind,
wise and mystical expression,
Japanese shrine aesthetic,
pixel-art flame effects around tails,
black outline, mid-resolution pixel art,
transparent background
```

---

## 生成ワークフロー

1. **ChatGPT にアクセス**（GPT-4o / Image generation 機能）
2. 上記プロンプトを日本語 or 英語で入力
3. **同じプロンプトで2〜3回生成**して一番いいやつを採用
4. 採用した画像を `/Users/mariko/Desktop/` に保存
5. 保存後、AI社員が自動で `assets/sprites-original/` と `assets/sprites/` に配置＆リサイズ

---

## リサイズ仕様

- Web用: **512×512 PNG**（NEAREST リサンプル＝ドット感保持）
- 原本: オリジナル解像度のまま `sprites-original/` に保管
- 使用スクリプト: `python3 -c "from PIL import Image; ..."` のワンライナー or `scripts/resize-sprite.py`（後で作成）

---

## mariko 実際のプロンプト記録（使用後に追記）

| Lv | 実際のプロンプト | 生成日 | 備考 |
|----|----------------|--------|------|
| Lv.1 | （mariko記入欄） | 2026-04-23 | GPT Image 2 |
| Lv.2 | （mariko記入欄） | 2026-04-23 | GPT Image 2 |
| Lv.3 | | | |
| Lv.4 | | | |
| Lv.5 | | | |
