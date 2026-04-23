/* =========================================================
   課題マスター（AI関連ミッション・モックデータ）
   =========================================================
   将来: GAS WebApp 経由でスプシから取得。現状はフロント埋め込み。
   difficulty: 1〜5（難易度星）
   xp:         承認時に加算されるXP（★1=15 / ★2=25 / ★3=40 / ★4=60 / ★5=80）
   hint:       使うAIツールの例・プロンプトのヒント（1行）
   ========================================================= */

const XP_BY_STAR = { 1: 15, 2: 25, 3: 40, 4: 60, 5: 80 };

const MOCK_MISSIONS = [
  // --- 英語 ---
  { id: "m-e01", subject: "英語",   difficulty: 1, xp: 15,
    title: "AIに英単語カードを作ってもらう",
    desc: "好きなジャンルの英単語10個を、例文付きで作ってもらおう",
    hint: "ChatGPT・Gemini で「単語10個と例文を作って」" },

  { id: "m-e02", subject: "英語",   difficulty: 2, xp: 25,
    title: "AIと5分間 英会話する",
    desc: "AIと英語でおしゃべり。トピックは自由（趣味・日常など）",
    hint: "ChatGPT音声モード / Duolingo Max" },

  { id: "m-e03", subject: "英語",   difficulty: 3, xp: 40,
    title: "AIに英作文を添削してもらう",
    desc: "100字くらいの英作文を書いて、AIに自然さ・文法を直してもらう",
    hint: "ChatGPT や Claude に「ネイティブっぽく直して」" },

  { id: "m-e04", subject: "英語",   difficulty: 4, xp: 60,
    title: "AIで英語ニュースを要約",
    desc: "英語のニュース記事をAIに要約させて、内容をノートにまとめる",
    hint: "Perplexity / Claude / NHK World の記事など" },

  { id: "m-e05", subject: "英語",   difficulty: 5, xp: 80,
    title: "AIに英検問題を解説させて学ぶ",
    desc: "過去問を解いて、AIに解説してもらい分からなかった所を深掘り",
    hint: "問題画像 + 「解説して」" },

  // --- 数学 ---
  { id: "m-m01", subject: "数学",   difficulty: 1, xp: 15,
    title: "分からない問題をAIに聞く",
    desc: "解けない問題を写真に撮って、AIに質問→自分で解きなおす",
    hint: "Gemini / ChatGPT 画像入力" },

  { id: "m-m02", subject: "数学",   difficulty: 2, xp: 25,
    title: "AIに別の解き方を教えてもらう",
    desc: "1問につき「別解を2通り出して」と依頼。理解が深まる",
    hint: "ChatGPT / Claude に別解プロンプト" },

  { id: "m-m03", subject: "数学",   difficulty: 3, xp: 40,
    title: "AIと「なぜ？」対話で公式を深掘り",
    desc: "1つの公式について「なぜ？」を3回以上繰り返して本質を理解",
    hint: "Claude / ChatGPT とのラリー対話" },

  { id: "m-m04", subject: "数学",   difficulty: 4, xp: 60,
    title: "AIに応用問題を作ってもらって解く",
    desc: "学年とテーマを指定して10問作成させ、自分で解いてみよう",
    hint: "「中2レベルの二次方程式10問作って」" },

  { id: "m-m05", subject: "数学",   difficulty: 5, xp: 80,
    title: "AIで数学を可視化する",
    desc: "関数やグラフをAIに図示してもらい、特徴を説明する",
    hint: "Wolfram Alpha / ChatGPT のグラフ機能" },

  // --- 国語 ---
  { id: "m-j01", subject: "国語",   difficulty: 1, xp: 15,
    title: "AIに本のあらすじを要約してもらう",
    desc: "読んだ本や気になる本をAIに要約してもらい、自分の感想を添える",
    hint: "「小学生/中学生向けに要約して」" },

  { id: "m-j02", subject: "国語",   difficulty: 2, xp: 25,
    title: "AIと物語の続きを作る",
    desc: "自分で書き出しを作り、AIに続きを3パターン出してもらおう",
    hint: "ChatGPT / Claude と共同創作" },

  { id: "m-j03", subject: "国語",   difficulty: 3, xp: 40,
    title: "AIに作文を添削してもらう",
    desc: "200字くらいの作文を書いて、AIに「もっと伝わる書き方」を聞く",
    hint: "「この作文を読みやすく直して理由も教えて」" },

  { id: "m-j04", subject: "国語",   difficulty: 4, xp: 60,
    title: "AIとディベート練習",
    desc: "テーマを決めて、AIに反対側の役をやってもらい議論する",
    hint: "「〇〇について反対の立場で議論して」" },

  { id: "m-j05", subject: "国語",   difficulty: 5, xp: 80,
    title: "AIで古文・漢文を現代語訳",
    desc: "1つ選んで、AIに現代語訳と解説をしてもらう",
    hint: "原文貼り付け + 「現代語訳と解説」" },

  // --- クリエイティブ / その他 ---
  { id: "m-o01", subject: "その他", difficulty: 1, xp: 15,
    title: "AIでオリジナルイラストを作る",
    desc: "好きなキャラや風景を生成して、1枚完成させよう",
    hint: "Canva / NanoBanana / Midjourney" },

  { id: "m-o02", subject: "その他", difficulty: 2, xp: 25,
    title: "AIと動画の台本を書く",
    desc: "30秒〜1分のショート動画用の台本を作って提出",
    hint: "ChatGPT で構成 → 自分でリライト" },

  { id: "m-o03", subject: "その他", difficulty: 3, xp: 40,
    title: "AIで音楽を作曲する",
    desc: "ジャンルや雰囲気を指定してオリジナル曲を作ろう",
    hint: "Suno AI / Udio" },

  { id: "m-o04", subject: "その他", difficulty: 4, xp: 60,
    title: "AIと一緒にScratchゲームを作る",
    desc: "AIにコードの相談をしながら、動くミニゲームを完成させよう",
    hint: "Claude / ChatGPT にコード質問" },

  { id: "m-o05", subject: "その他", difficulty: 5, xp: 80,
    title: "自分だけのカスタムAIを作る",
    desc: "テーマを決めて、自分用のAIアシスタントを作って使ってみる",
    hint: "MyGPT / Claude Projects / Gem" },
];
